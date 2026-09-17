/**
 * Composition: the ESI error-limit back-off applies to every endpoint.
 *
 * ESI's error limit is global to the client, not per endpoint: a response
 * with `X-ESI-Error-Limit-Remain: 0` means every further request, to any
 * route, counts against an exhausted budget until
 * `X-ESI-Error-Limit-Reset` seconds have passed. Here the server status call
 * is answered with a 420 saying so, while calls to endpoints in other rate
 * limit groups (dogma attributes has none, incursions has its own) are in
 * flight or about to start. Whatever the order, no request to any endpoint
 * may leave inside the reset window once the 420 has arrived, including a
 * response to a request sent before the 420 that arrives after it, and every
 * call still completes once the window has passed.
 *
 * No Rule in tests/bdd/features states the error-limit back-off yet; see the
 * tier's AGENTS.md. The retry of a 420 is the Rule "If a GET request is
 * answered with HTTP 420 or 429 while retries remain, then the request
 * pipeline shall issue the same request again." in
 * tests/bdd/features/core/0051-resilience.feature.
 */
import { EsiClient } from '../../../src/EsiClient';
import { HttpResponse } from '../../bdd/support/transport';
import { Actor, Scenario, explore } from './support/interleave';
import {
  DOGMA_ATTRIBUTES_PATH,
  STATUS_PATH,
  createPipelineClient,
  describeOutcome,
  expectExplored,
  SCENARIO_TIMEOUT_MS,
  scenarioOptions,
  statusPayload,
  widths,
} from './support/world';

const RESET_SECONDS = 30;
const INCURSIONS_PATH = '/incursions';
const INSURANCE_PATH = '/insurance/prices';

interface World {
  client: EsiClient;
}

const ALL_ACTORS: Actor<World>[] = [
  { name: 'status', run: (w) => w.client.status.getStatus() },
  { name: 'dogma', run: (w) => w.client.dogma.getAttributes() },
  { name: 'incursions', run: (w) => w.client.incursions.getIncursions() },
  { name: 'insurance', run: (w) => w.client.insurance.getInsurancePrices() },
];

const PATHS: Record<string, string> = {
  dogma: DOGMA_ATTRIBUTES_PATH,
  incursions: INCURSIONS_PATH,
  insurance: INSURANCE_PATH,
};

const BODIES: Record<string, unknown> = {
  [STATUS_PATH]: statusPayload(1),
  [DOGMA_ATTRIBUTES_PATH]: [1, 2],
  [INCURSIONS_PATH]: [],
  [INSURANCE_PATH]: [],
};

function scenario(name: string, actors: Actor<World>[]): Scenario<World> {
  return {
    name,
    setup: async () => ({ client: createPipelineClient() }),
    teardown: (w) => w.client.shutdown(),
    actors,
    respond: (request, _world, trace): HttpResponse => {
      const firstStatus = trace.requests.find((r) => r.path === STATUS_PATH);
      if (request === firstStatus) {
        return {
          status: 420,
          headers: {
            'x-esi-error-limit-remain': '0',
            'x-esi-error-limit-reset': String(RESET_SECONDS),
          },
          body: {
            error: 'This software has exceeded the error limit for ESI.',
          },
        };
      }
      return {
        // ESI reports the budget on every response. A request sent before the
        // 420 was processed before it, so its count is higher.
        headers: {
          'x-esi-error-limit-remain': '95',
          'x-esi-error-limit-reset': String(RESET_SECONDS),
        },
        body: BODIES[request.path],
      };
    },
    invariants: {
      'no request to any endpoint leaves inside the reset window after the 420 arrives':
        (trace) => {
          const limited = trace.requests.find(
            (r) => r.response?.status === 420,
          );
          if (!limited) return 'the status request was never answered';
          const arrived = trace.events.findIndex(
            (e) => e.kind === 'deliver' && e.ordinal === limited.ordinal,
          );
          const windowEnds = limited.deliveredAt! + RESET_SECONDS * 1_000;
          const early = trace.events
            .slice(arrived + 1)
            .filter((e) => e.kind === 'send' && e.at < windowEnds);
          return early.length === 0
            ? undefined
            : `${early.map((e) => `${e.label} at +${e.at}ms`).join('; ')}; the window ends at +${windowEnds}ms`;
        },
      'every call completes once the window has passed': (trace) => {
        const failed = actors
          .map((a) => trace.outcomes.get(a.name))
          .filter((o) => !o?.ok);
        return failed.length === 0
          ? undefined
          : failed.map((o) => `${o?.actor} ${describeOutcome(o)}`).join('; ');
      },
      'the error-limited status call is retried exactly once': (trace) => {
        const status = trace.requests.filter((r) => r.path === STATUS_PATH);
        return status.length === 2
          ? undefined
          : `${status.length} status requests were sent`;
      },
      'each other endpoint is requested exactly once': (trace) => {
        for (const actor of actors) {
          if (actor.name === 'status') continue;
          const path = PATHS[actor.name]!;
          const sent = trace.requests.filter((r) => r.path === path).length;
          if (sent !== 1) return `${path} was requested ${sent} times`;
        }
        return undefined;
      },
    },
  };
}

jest.setTimeout(SCENARIO_TIMEOUT_MS);

/** Exhaustive schedule counts, by number of calls. */
const PINNED: Record<number, number> = { 2: 27, 3: 1278 };

describe('composition: ESI error-limit back-off across endpoints', () => {
  it.each(widths())(
    '%i calls: a 420 exhausting the error limit holds back every endpoint',
    async (width) => {
      const actors = ALL_ACTORS.slice(0, width);
      const testName = `${width} calls: a 420 exhausting the error limit holds back every endpoint`;
      const options = scenarioOptions(testName);
      const report = await explore(scenario(testName, actors), options);
      expectExplored(report, PINNED[width]!, options);
    },
  );
});
