/**
 * Deterministic interleaving scheduler for the composition tier.
 *
 * A scenario starts several calls against one client whose whole request
 * pipeline is live, and the only thing mocked is HTTP, at the BDD transport
 * seam. Every request the pipeline sends is held at the seam. The scheduler
 * then decides, one step at a time, which of the enabled events happens next:
 *
 *   - `start <actor>`   an actor that has not started yet makes its call;
 *   - `deliver #n`      the response to held request n arrives. The scenario's
 *                       `respond` picks the response at that moment, and it is
 *                       queued with `queueResponse`, so the seam stays strict;
 *   - `timer +<ms>`     virtual time (Jest fake timers) advances to the next
 *                       pending setTimeout within the horizon.
 *
 * After each step the microtask queue is drained on real `setImmediate` turns
 * until the system is quiet, so each step's consequences are fully visible
 * before the next choice.
 *
 * Exhaustive mode walks every choice sequence depth-first, re-running the
 * scenario from scratch for each one, up to `maxSchedules`. Random mode picks
 * each step from a seeded PRNG. A failure names the broken invariant, prints
 * the event sequence, and gives the exact command that replays that schedule.
 * The scheduler also fails when a replayed prefix offers different choices
 * than it did the first time: a scenario whose interleavings are not
 * reproducible cannot be explored.
 */
import {
  HttpResponse,
  RecordedRequest,
  finishTransport,
  queueResponse,
  setRequestGate,
  startTransport,
} from '../../../bdd/support/transport';

/** Virtual wall clock at the start of every schedule. */
export const EPOCH_MS = Date.UTC(2026, 0, 1, 12, 0, 0);

/** Timers further in the future than this are never fired by a `timer` step. */
export const DEFAULT_HORIZON_MS = 120_000;

export interface Actor<W> {
  name: string;
  run: (world: W) => Promise<unknown>;
}

export interface SentRequest {
  /** 1-based arrival order at the seam. */
  ordinal: number;
  phase: 'concurrent' | 'follow-up';
  method: string;
  /** Path plus query string, e.g. `/status/?datasource=tranquility`. */
  path: string;
  ifNoneMatch: string | undefined;
  sentAt: number;
  deliveredAt: number | undefined;
  response: HttpResponse | undefined;
  raw: RecordedRequest;
}

export interface Outcome {
  actor: string;
  ok: boolean;
  value: unknown;
  error: unknown;
  startedAt: number;
  settledAt: number;
}

export interface TraceEvent {
  /** Milliseconds since EPOCH_MS. */
  at: number;
  kind: 'start' | 'send' | 'deliver' | 'timer' | 'settle' | 'phase';
  label: string;
  /** The request this event concerns, for `send` and `deliver`. */
  ordinal?: number;
  /** The actor this event concerns, for `start` and `settle`. */
  actor?: string;
  /** Timer callbacks this step fired, for `timer`. */
  fired?: number;
}

export interface Trace {
  events: TraceEvent[];
  requests: SentRequest[];
  outcomes: Map<string, Outcome>;
  /** setTimeout callbacks that fired, across both phases. */
  timersFired: number;
  choices: number[];
}

export interface Scenario<W> {
  name: string;
  /**
   * Builds a fresh world for one schedule. Runs with the transport started,
   * fake timers at EPOCH_MS and no gate, so it may queue responses and make
   * calls in sequence (to prime a cache, say) and advance virtual time.
   */
  setup: () => Promise<W>;
  /** The calls whose interleavings are explored. */
  actors: Actor<W>[];
  /** Picks the response to a request at the moment it is delivered. */
  respond: (request: SentRequest, world: W, trace: Trace) => HttpResponse;
  /**
   * Calls made after every actor has settled, one at a time with no choices,
   * to observe the state the concurrent phase left behind.
   */
  followUp?: Actor<W>[];
  /**
   * Named invariants over the finished trace. Each returns undefined when it
   * holds and a description of what broke when it does not.
   */
  invariants: Record<string, (trace: Trace, world: W) => string | undefined>;
  teardown?: (world: W) => void;
  horizonMs?: number;
}

export interface ExploreOptions {
  mode: 'exhaustive' | 'random';
  /** Exhaustive mode stops after this many schedules and reports incomplete. */
  maxSchedules: number;
  /** Random mode runs this many schedules. */
  runs: number;
  seed: number;
  /** Run exactly this choice sequence (missing steps take choice 0). */
  replay?: number[];
  /** The `-t` filter printed in the reproduce command. */
  testName?: string;
}

export interface ExploreReport {
  scenario: string;
  mode: ExploreOptions['mode'] | 'replay';
  schedules: number;
  complete: boolean;
  seed: number;
}

export class InterleavingFailure extends Error {
  readonly choices: number[];
  constructor(message: string, choices: number[]) {
    super(message);
    this.name = 'InterleavingFailure';
    this.choices = choices;
  }
}

const QUIET_TURNS = 3;
const MAX_TURNS = 500;

/** mulberry32: a small seeded PRNG; the same seed gives the same sequence. */
export function createPrng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseIntStrict(name: string, value: string): number {
  if (!/^-?\d+$/.test(value.trim())) {
    throw new Error(`${name} must be an integer, got "${value}"`);
  }
  return Number(value.trim());
}

/**
 * Exploration options from the environment. Fails closed: a malformed value
 * throws rather than silently falling back to a default.
 *
 *   ESI_INTERLEAVE_MODE     exhaustive (default) | random
 *   ESI_INTERLEAVE_SEED     integer seed for random mode (default: fresh)
 *   ESI_INTERLEAVE_RUNS     schedules per scenario in random mode (default 200)
 *   ESI_INTERLEAVE_REPLAY   comma-separated choice sequence to replay
 */
export function optionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  freshSeed: () => number = () => Math.floor(Math.random() * 2 ** 31),
): ExploreOptions {
  const modeRaw = env.ESI_INTERLEAVE_MODE ?? 'exhaustive';
  if (modeRaw !== 'exhaustive' && modeRaw !== 'random') {
    throw new Error(
      `ESI_INTERLEAVE_MODE must be "exhaustive" or "random", got "${modeRaw}"`,
    );
  }
  const seed =
    env.ESI_INTERLEAVE_SEED !== undefined && env.ESI_INTERLEAVE_SEED !== ''
      ? parseIntStrict('ESI_INTERLEAVE_SEED', env.ESI_INTERLEAVE_SEED)
      : freshSeed();
  const runs =
    env.ESI_INTERLEAVE_RUNS !== undefined && env.ESI_INTERLEAVE_RUNS !== ''
      ? parseIntStrict('ESI_INTERLEAVE_RUNS', env.ESI_INTERLEAVE_RUNS)
      : 200;
  if (runs < 1) throw new Error('ESI_INTERLEAVE_RUNS must be at least 1');
  let replay: number[] | undefined;
  if (
    env.ESI_INTERLEAVE_REPLAY !== undefined &&
    env.ESI_INTERLEAVE_REPLAY !== ''
  ) {
    replay = env.ESI_INTERLEAVE_REPLAY.split(',').map((part) => {
      const n = parseIntStrict('ESI_INTERLEAVE_REPLAY', part);
      if (n < 0) throw new Error('ESI_INTERLEAVE_REPLAY choices must be >= 0');
      return n;
    });
  }
  return { mode: modeRaw, maxSchedules: 5000, runs, seed, replay };
}

interface Option {
  label: string;
  apply: () => Promise<void>;
}

interface PendingTimer {
  due: number;
}

interface ClockTracker {
  pending: Map<unknown, PendingTimer>;
  fired: number;
  restore: () => void;
}

/**
 * Wraps the fake setTimeout so the scheduler can see when each pending timer
 * is due; Jest's fake timers do not expose that.
 */
function trackTimers(): ClockTracker {
  const fakeSet = globalThis.setTimeout;
  const fakeClear = globalThis.clearTimeout;
  const tracker: ClockTracker = {
    pending: new Map(),
    fired: 0,
    restore: () => {
      globalThis.setTimeout = fakeSet;
      globalThis.clearTimeout = fakeClear;
    },
  };
  const wrappedSet = (
    callback: (...args: unknown[]) => void,
    ms?: number,
    ...args: unknown[]
  ) => {
    const delay = Math.max(0, Number(ms) || 0);
    const handle: unknown = fakeSet(() => {
      tracker.pending.delete(handle);
      tracker.fired += 1;
      callback(...args);
    }, delay);
    tracker.pending.set(handle, { due: Date.now() + delay });
    return handle;
  };
  const wrappedClear = (handle: unknown) => {
    tracker.pending.delete(handle);
    fakeClear(handle as Parameters<typeof clearTimeout>[0]);
  };
  globalThis.setTimeout = wrappedSet as unknown as typeof setTimeout;
  globalThis.clearTimeout = wrappedClear as unknown as typeof clearTimeout;
  return tracker;
}

const realSetImmediate = globalThis.setImmediate;

function describeValue(value: unknown): string {
  if (value instanceof Error) {
    const status = (value as { statusCode?: unknown }).statusCode;
    return `${value.name}${status !== undefined ? ` ${String(status)}` : ''}`;
  }
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json.slice(0, 80);
}

class Run<W> {
  readonly trace: Trace;
  world!: W;
  private readonly held = new Map<number, () => void>();
  private readonly started = new Set<string>();
  private settledCount = 0;
  private tracker!: ClockTracker;
  private phase: SentRequest['phase'] = 'concurrent';
  /** Option labels offered at each step, for the reproducibility check. */
  readonly offered: string[][] = [];

  constructor(
    private readonly scenario: Scenario<W>,
    private readonly pick: (labels: string[], step: number) => number,
  ) {
    this.trace = {
      events: [],
      requests: [],
      outcomes: new Map(),
      timersFired: 0,
      choices: [],
    };
  }

  private now(): number {
    return Date.now() - EPOCH_MS;
  }

  private log(event: Omit<TraceEvent, 'at'>): void {
    this.trace.events.push({ at: this.now(), ...event });
  }

  private fingerprint(): string {
    return [
      this.trace.requests.length,
      this.held.size,
      this.settledCount,
      this.tracker.pending.size,
      this.tracker.fired,
    ].join('|');
  }

  private async quiesce(): Promise<void> {
    let last = '';
    let quiet = 0;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      await new Promise<void>((resolve) => realSetImmediate(resolve));
      const fp = this.fingerprint();
      if (fp === last) {
        quiet += 1;
        if (quiet >= QUIET_TURNS) return;
      } else {
        quiet = 0;
        last = fp;
      }
    }
    throw new Error(`the pipeline did not go quiet within ${MAX_TURNS} turns`);
  }

  private startActor(actor: Actor<W>): void {
    this.started.add(actor.name);
    const startedAt = this.now();
    this.log({
      kind: 'start',
      label: `start ${actor.name}`,
      actor: actor.name,
    });
    const settle = (ok: boolean, value: unknown, error: unknown) => {
      this.settledCount += 1;
      this.trace.outcomes.set(actor.name, {
        actor: actor.name,
        ok,
        value,
        error,
        startedAt,
        settledAt: this.now(),
      });
      this.log({
        kind: 'settle',
        label: `settle ${actor.name} ${ok ? 'resolved' : 'rejected'} ${describeValue(ok ? value : error)}`,
        actor: actor.name,
      });
    };
    let promise: Promise<unknown>;
    try {
      promise = actor.run(this.world);
    } catch (error) {
      promise = Promise.reject(error);
    }
    promise.then(
      (value) => settle(true, value, undefined),
      (error: unknown) => settle(false, undefined, error),
    );
  }

  private options(pendingActors: Actor<W>[]): Option[] {
    const options: Option[] = [];
    for (const actor of pendingActors) {
      if (!this.started.has(actor.name)) {
        options.push({
          label: `start ${actor.name}`,
          apply: async () => this.startActor(actor),
        });
      }
    }
    for (const [ordinal, release] of this.held) {
      options.push({
        label: `deliver #${ordinal}`,
        apply: async () => {
          const request = this.trace.requests[ordinal - 1]!;
          const response = this.scenario.respond(
            request,
            this.world,
            this.trace,
          );
          if (response.delayMs !== undefined || response.times !== undefined) {
            throw new Error('respond() must not set delayMs or times');
          }
          request.response = response;
          request.deliveredAt = this.now();
          this.log({
            kind: 'deliver',
            label: `deliver #${ordinal} ${response.status ?? 200}${response.headers?.etag ? ` etag=${response.headers.etag}` : ''}`,
            ordinal,
          });
          queueResponse({ ...response, match: request.raw.url.href });
          this.held.delete(ordinal);
          release();
        },
      });
    }
    const horizon = this.scenario.horizonMs ?? DEFAULT_HORIZON_MS;
    const now = Date.now();
    let nextDue = Infinity;
    for (const timer of this.tracker.pending.values()) {
      if (timer.due - now <= horizon && timer.due < nextDue)
        nextDue = timer.due;
    }
    if (nextDue !== Infinity) {
      const wait = nextDue - now;
      options.push({
        label: `timer +${wait}ms`,
        apply: async () => {
          const event: TraceEvent = {
            at: this.now() + wait,
            kind: 'timer',
            label: `timer +${wait}ms`,
            fired: 0,
          };
          this.trace.events.push(event);
          const before = this.tracker.fired;
          await jest.advanceTimersByTimeAsync(wait);
          event.fired = this.tracker.fired - before;
          event.label = `timer +${wait}ms (${event.fired} fired)`;
        },
      });
    }
    return options;
  }

  private gate = (raw: RecordedRequest): Promise<void> => {
    const ordinal = this.trace.requests.length + 1;
    const request: SentRequest = {
      ordinal,
      phase: this.phase,
      method: raw.method,
      path: `${raw.url.pathname}${raw.url.search}`,
      ifNoneMatch: raw.headers['if-none-match'],
      sentAt: this.now(),
      deliveredAt: undefined,
      response: undefined,
      raw,
    };
    this.trace.requests.push(request);
    this.log({
      kind: 'send',
      label: `send #${ordinal} ${request.method} ${request.path}${request.ifNoneMatch ? ` if-none-match=${request.ifNoneMatch}` : ''}`,
      ordinal,
    });
    return new Promise<void>((resolve) => this.held.set(ordinal, resolve));
  };

  private async drive(actors: Actor<W>[], choose: boolean): Promise<void> {
    for (;;) {
      await this.quiesce();
      const options = this.options(actors);
      const unsettled = actors.filter((a) => !this.trace.outcomes.has(a.name));
      if (unsettled.length === 0 && this.held.size === 0) return;
      if (options.length === 0) {
        const timers = [...this.tracker.pending.values()]
          .map((t) => `+${t.due - Date.now()}ms`)
          .join(', ');
        throw new Error(
          `deadlock: ${unsettled.map((a) => a.name).join(', ') || 'no actor'} never settled; pending timers beyond the horizon: ${timers || 'none'}`,
        );
      }
      let index = 0;
      if (choose) {
        const labels = options.map((o) => o.label);
        const step = this.offered.length;
        this.offered.push(labels);
        index = this.pick(labels, step);
        if (index < 0 || index >= options.length) {
          throw new Error(
            `choice ${index} at step ${step} is out of range; options were: ${labels.join(' | ')}`,
          );
        }
        this.trace.choices.push(index);
      } else {
        // Follow-up: start actors in order, one at a time, and let the rest run.
        const next =
          options.find((o) => !o.label.startsWith('start ')) ?? options[0]!;
        index = options.indexOf(next);
      }
      await options[index]!.apply();
    }
  }

  async execute(): Promise<void> {
    jest.useFakeTimers({
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'queueMicrotask',
      ],
      now: EPOCH_MS,
    });
    this.tracker = trackTimers();
    startTransport();
    try {
      this.world = await this.scenario.setup();
      setRequestGate(this.gate);
      await this.drive(this.scenario.actors, true);
      if (this.scenario.followUp && this.scenario.followUp.length > 0) {
        this.phase = 'follow-up';
        this.log({ kind: 'phase', label: 'follow-up' });
        for (const actor of this.scenario.followUp) {
          await this.drive([actor], false);
        }
      }
      this.trace.timersFired = this.tracker.fired;
      setRequestGate(null);
      finishTransport();
    } finally {
      setRequestGate(null);
      if (this.world !== undefined) this.scenario.teardown?.(this.world);
      this.tracker.restore();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }
}

export function formatTrace(trace: Trace): string {
  return trace.events.map((e) => `    t=+${e.at}ms ${e.label}`).join('\n');
}

function reproduceCommand(
  scenario: string,
  choices: number[],
  testName: string | undefined,
): string {
  const filter = (testName ?? scenario).replace(/"/g, '\\"');
  return `ESI_INTERLEAVE_REPLAY=${choices.join(',')} npx jest --config jest.unit.config.cjs --testPathPatterns=composition -t "${filter}"`;
}

async function runOnce<W>(
  scenario: Scenario<W>,
  pick: (labels: string[], step: number) => number,
  options: ExploreOptions,
  mode: ExploreReport['mode'],
): Promise<Run<W>> {
  const run = new Run(scenario, pick);
  const header = (what: string) =>
    [
      `Composition ${what} in scenario "${scenario.name}"`,
      `  mode: ${mode}${mode === 'random' ? `, seed ${options.seed} (ESI_INTERLEAVE_MODE=random ESI_INTERLEAVE_SEED=${options.seed})` : ''}`,
      `  schedule (choice per step): [${run.trace.choices.join(',')}]`,
      `  events:\n${formatTrace(run.trace)}`,
      `  reproduce: ${reproduceCommand(scenario.name, run.trace.choices, options.testName)}`,
    ].join('\n');
  try {
    await run.execute();
  } catch (error) {
    if (error instanceof InterleavingFailure) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw new InterleavingFailure(
      `${header('run failed')}\n  error: ${reason}`,
      run.trace.choices,
    );
  }
  const broken: string[] = [];
  for (const [name, check] of Object.entries(scenario.invariants)) {
    const problem = check(run.trace, run.world);
    if (problem !== undefined)
      broken.push(`  invariant "${name}" broke: ${problem}`);
  }
  if (broken.length > 0) {
    throw new InterleavingFailure(
      `${header('invariant broken')}\n${broken.join('\n')}`,
      run.trace.choices,
    );
  }
  return run;
}

/**
 * Explore a scenario's interleavings. Resolves with a report when every
 * schedule run satisfied every invariant; rejects with an InterleavingFailure
 * naming the first schedule that did not.
 */
export async function explore<W>(
  scenario: Scenario<W>,
  options: ExploreOptions,
): Promise<ExploreReport> {
  if (options.replay) {
    const replay = options.replay;
    await runOnce(
      scenario,
      (_labels, step) => replay[step] ?? 0,
      options,
      'replay',
    );
    return {
      scenario: scenario.name,
      mode: 'replay',
      schedules: 1,
      complete: false,
      seed: options.seed,
    };
  }

  if (options.mode === 'random') {
    const random = createPrng(options.seed);
    for (let i = 0; i < options.runs; i++) {
      await runOnce(
        scenario,
        (labels) => Math.floor(random() * labels.length),
        options,
        'random',
      );
    }
    return {
      scenario: scenario.name,
      mode: 'random',
      schedules: options.runs,
      complete: false,
      seed: options.seed,
    };
  }

  let prefix: number[] = [];
  let firstOffers: string[][] = [];
  let schedules = 0;
  for (;;) {
    const current = prefix;
    const expected = firstOffers;
    const run = await runOnce(
      scenario,
      (labels, step) => {
        if (step < current.length) {
          const seen = expected[step];
          if (seen && seen.join(' | ') !== labels.join(' | ')) {
            throw new Error(
              `nondeterministic scenario: step ${step} offered [${labels.join(' | ')}] on replay but [${seen.join(' | ')}] before`,
            );
          }
          return current[step]!;
        }
        return 0;
      },
      options,
      'exhaustive',
    );
    schedules += 1;
    const offers = run.offered;
    const choices = run.trace.choices;
    let depth = choices.length - 1;
    while (depth >= 0 && choices[depth]! + 1 >= offers[depth]!.length) depth--;
    if (depth < 0) {
      return {
        scenario: scenario.name,
        mode: 'exhaustive',
        schedules,
        complete: true,
        seed: options.seed,
      };
    }
    if (schedules >= options.maxSchedules) {
      return {
        scenario: scenario.name,
        mode: 'exhaustive',
        schedules,
        complete: false,
        seed: options.seed,
      };
    }
    prefix = [...choices.slice(0, depth), choices[depth]! + 1];
    firstOffers = offers.slice(0, depth + 1);
  }
}
