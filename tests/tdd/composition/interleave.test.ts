/**
 * The interleaving scheduler is the composition tier's instrument, so it has
 * to be shown to work before any pipeline result means anything: it must
 * enumerate exactly the schedules that exist, find a race it is pointed at,
 * replay a failing schedule exactly, and refuse scenarios it cannot explore
 * faithfully (deadlocks, nondeterminism, malformed environment).
 */
import {
  ExploreOptions,
  InterleavingFailure,
  Scenario,
  createPrng,
  explore,
  optionsFromEnv,
} from './support/interleave';

const URL_A = 'https://esi.evetech.net/toy/a/';
const URL_B = 'https://esi.evetech.net/toy/b/';

const exhaustive: ExploreOptions = {
  mode: 'exhaustive',
  maxSchedules: 1000,
  runs: 1,
  seed: 1,
};

function fetchText(url: string): Promise<string> {
  return fetch(url).then((r) => r.text());
}

/** Two actors, one request each, independent. */
function twoFetches(
  invariants: Scenario<object>['invariants'] = {},
): Scenario<object> {
  return {
    name: 'two independent fetches',
    setup: async () => ({}),
    actors: [
      { name: 'A', run: () => fetchText(URL_A) },
      { name: 'B', run: () => fetchText(URL_B) },
    ],
    respond: (request) => ({ body: `reply ${request.path}` }),
    invariants,
  };
}

interface Counter {
  value: number;
}

/**
 * A lost-update race: each actor reads the counter, awaits a request, then
 * writes back what it read plus one. Any schedule that lets both reads
 * happen before either write loses an increment.
 */
function lostUpdate(): Scenario<Counter> {
  const increment = async (world: Counter, url: string) => {
    const read = world.value;
    await fetchText(url);
    world.value = read + 1;
  };
  return {
    name: 'lost update toy',
    setup: async () => ({ value: 0 }),
    actors: [
      { name: 'A', run: (w) => increment(w, URL_A) },
      { name: 'B', run: (w) => increment(w, URL_B) },
    ],
    respond: () => ({ body: 'ok' }),
    invariants: {
      'both increments are kept': (_t, w) =>
        w.value === 2 ? undefined : `counter is ${w.value}, expected 2`,
    },
  };
}

describe('interleaving scheduler', () => {
  it('enumerates every ordering of two starts and two deliveries exactly once', async () => {
    const seen = new Set<string>();
    const report = await explore(
      twoFetches({
        'records the schedule': (trace) => {
          seen.add(
            trace.events
              .filter((e) => e.kind === 'start' || e.kind === 'deliver')
              .map((e) => e.label)
              .join(' > '),
          );
          return undefined;
        },
      }),
      exhaustive,
    );

    // start A, start B, deliver #1, deliver #2 where each delivery follows its
    // own send: 4! / (2 * 2) = 6 orderings, all distinct.
    expect(report).toEqual({
      scenario: 'two independent fetches',
      mode: 'exhaustive',
      schedules: 6,
      complete: true,
      seed: 1,
    });
    expect(seen.size).toBe(6);
  });

  it('records sends and deliveries with method, path and arrival order', async () => {
    let requests: string[] = [];
    await explore(
      twoFetches({
        capture: (trace) => {
          requests = trace.requests.map(
            (r) =>
              `#${r.ordinal} ${r.method} ${r.path} ${r.response?.status ?? 200}`,
          );
          return undefined;
        },
      }),
      { ...exhaustive, replay: [1, 0] },
    );

    // Choice 1 at step 0 starts B first, so B's request arrives as #1.
    expect(requests).toEqual(['#1 GET /toy/b/ 200', '#2 GET /toy/a/ 200']);
  });

  it('finds a lost-update race and reports the schedule that exposes it', async () => {
    const failure = await explore(lostUpdate(), exhaustive).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(InterleavingFailure);
    const message = (failure as InterleavingFailure).message;
    expect(message).toContain('invariant "both increments are kept" broke');
    expect(message).toContain('counter is 1, expected 2');
    expect(message).toContain(
      `ESI_INTERLEAVE_REPLAY=${(failure as InterleavingFailure).choices.join(',')} npx jest --config jest.unit.config.cjs --testPathPatterns=composition`,
    );
  });

  it('replays the reported schedule and fails the same way', async () => {
    const first = (await explore(lostUpdate(), exhaustive).catch(
      (e: unknown) => e,
    )) as InterleavingFailure;

    const replayed = (await explore(lostUpdate(), {
      ...exhaustive,
      replay: first.choices,
    }).catch((e: unknown) => e)) as InterleavingFailure;

    expect(replayed).toBeInstanceOf(InterleavingFailure);
    expect(replayed.choices).toEqual(first.choices);
    expect(replayed.message.split('events:')[1]).toEqual(
      first.message.split('events:')[1],
    );
  });

  it('passes a schedule that serialises the race', async () => {
    // start A, deliver #1 (A writes), start B, deliver #2: no lost update.
    const report = await explore(lostUpdate(), {
      ...exhaustive,
      replay: [0, 1, 0, 0],
    });
    expect(report.mode).toBe('replay');
  });

  it('offers a timer step and advances virtual time to the timer', async () => {
    let at: number[] = [];
    await explore(
      {
        name: 'timer then fetch',
        setup: async () => ({}),
        actors: [
          {
            name: 'A',
            run: async () => {
              await new Promise((r) => setTimeout(r, 750));
              return fetchText(URL_A);
            },
          },
        ],
        respond: () => ({ body: 'ok' }),
        invariants: {
          capture: (trace) => {
            at = trace.requests.map((r) => r.sentAt);
            return trace.timersFired === 1
              ? undefined
              : `${trace.timersFired} timers fired`;
          },
        },
      },
      exhaustive,
    );
    expect(at).toEqual([750]);
  });

  it('reports a deadlock when an actor waits on a timer beyond the horizon', async () => {
    const failure = (await explore(
      {
        name: 'waits forever',
        setup: async () => ({}),
        actors: [
          {
            name: 'A',
            run: () => new Promise((r) => setTimeout(r, 10 * 60_000)),
          },
        ],
        respond: () => ({ body: 'ok' }),
        invariants: {},
      },
      exhaustive,
    ).catch((e: unknown) => e)) as Error;

    expect(failure.message).toContain(
      'deadlock: A never settled; pending timers beyond the horizon: +600000ms',
    );
  });

  it('refuses a scenario whose choices change when a schedule is replayed', async () => {
    let runs = 0;
    const failure = (await explore(
      {
        name: 'flaky toy',
        setup: async () => {
          runs += 1;
          return {};
        },
        actors: [
          { name: 'A', run: () => fetchText(URL_A) },
          {
            name: 'B',
            // Sends only on the first run, so replays offer different steps.
            run: () => (runs === 1 ? fetchText(URL_B) : Promise.resolve('')),
          },
        ],
        respond: () => ({ body: 'ok' }),
        invariants: {},
      },
      exhaustive,
    ).catch((e: unknown) => e)) as Error;

    expect(failure.message).toContain('nondeterministic scenario');
  });

  it('rejects a replayed choice that is out of range for its step', async () => {
    const failure = (await explore(twoFetches(), {
      ...exhaustive,
      replay: [5],
    }).catch((e: unknown) => e)) as Error;

    expect(failure.message).toContain(
      'choice 5 at step 0 is out of range; options were: start A | start B',
    );
  });

  it('stops at maxSchedules and reports the exploration as incomplete', async () => {
    const report = await explore(twoFetches(), {
      ...exhaustive,
      maxSchedules: 4,
    });
    expect(report.schedules).toBe(4);
    expect(report.complete).toBe(false);
  });

  it('runs the same random schedules for the same seed and different ones for another', async () => {
    const collect = async (seed: number) => {
      const orders: string[] = [];
      await explore(
        twoFetches({
          capture: (trace) => {
            orders.push(trace.choices.join(''));
            return undefined;
          },
        }),
        { mode: 'random', runs: 12, seed, maxSchedules: 0 },
      );
      return orders;
    };

    const first = await collect(42);
    expect(await collect(42)).toEqual(first);
    expect(await collect(43)).not.toEqual(first);
  });

  it('prints the seed and mode when a random schedule breaks an invariant', async () => {
    const failure = (await explore(lostUpdate(), {
      mode: 'random',
      runs: 50,
      seed: 7,
      maxSchedules: 0,
    }).catch((e: unknown) => e)) as Error;

    expect(failure.message).toContain(
      'mode: random, seed 7 (ESI_INTERLEAVE_MODE=random ESI_INTERLEAVE_SEED=7)',
    );
  });

  it('fails the run when the pipeline sends a request the scenario did not see through', async () => {
    const failure = (await explore(
      {
        name: 'unconsumed',
        setup: async () => ({}),
        actors: [{ name: 'A', run: () => fetchText(URL_A) }],
        respond: () => ({ body: 'ok', delayMs: 5 }),
        invariants: {},
      },
      exhaustive,
    ).catch((e: unknown) => e)) as Error;

    expect(failure.message).toContain(
      'respond() must not set delayMs or times',
    );
  });
});

describe('createPrng', () => {
  it('produces the same sequence for the same seed within [0, 1)', () => {
    const a = createPrng(99);
    const b = createPrng(99);
    const values = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(values);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('optionsFromEnv', () => {
  it('defaults to exhaustive mode with a fresh seed', () => {
    expect(optionsFromEnv({}, () => 5)).toEqual({
      mode: 'exhaustive',
      maxSchedules: 5000,
      runs: 200,
      seed: 5,
      replay: undefined,
    });
  });

  it('reads random mode, seed, runs and a replay sequence', () => {
    expect(
      optionsFromEnv({
        ESI_INTERLEAVE_MODE: 'random',
        ESI_INTERLEAVE_SEED: '123',
        ESI_INTERLEAVE_RUNS: '9',
        ESI_INTERLEAVE_REPLAY: '0,2,1',
      }),
    ).toMatchObject({ mode: 'random', seed: 123, runs: 9, replay: [0, 2, 1] });
  });

  it.each([
    [{ ESI_INTERLEAVE_MODE: 'sometimes' }, 'ESI_INTERLEAVE_MODE must be'],
    [{ ESI_INTERLEAVE_SEED: 'abc' }, 'ESI_INTERLEAVE_SEED must be an integer'],
    [{ ESI_INTERLEAVE_RUNS: '0' }, 'ESI_INTERLEAVE_RUNS must be at least 1'],
    [
      { ESI_INTERLEAVE_REPLAY: '0,x' },
      'ESI_INTERLEAVE_REPLAY must be an integer',
    ],
    [{ ESI_INTERLEAVE_REPLAY: '0,-1' }, 'choices must be >= 0'],
  ])('fails closed on %j', (env, message) => {
    expect(() => optionsFromEnv(env, () => 1)).toThrow(message);
  });
});
