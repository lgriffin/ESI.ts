/**
 * Composition: stale-on-error while the stale entry is being refreshed.
 *
 * The cached server status has passed its spec TTL. One call revalidates it
 * and is answered with a refresh (a 200 carrying a new body, or a 304), while
 * a concurrent call for the same resource is answered with a 503 and falls
 * back to the cached copy. The fallback must serve whatever the cache holds
 * when the 503 arrives, flag only that response stale, and leave the refresh
 * in place: a call inside the TTL afterwards gets the refreshed entry with no
 * request.
 *
 * Backs these Rules in tests/bdd/features/core/0050-etag-caching.feature:
 *   - "If a GET request is answered with a 5xx status while the ETag cache
 *     holds an unexpired entry for it, then the EsiClient shall resolve with
 *     the cached body and flag the response as stale."
 *   - "When a revalidation is answered with HTTP 304, the ETag cache shall
 *     restart the freshness TTL of the cached entry."
 */
import { EsiClient } from '../../../src/EsiClient';
import { HttpResponse, queueResponse } from '../../bdd/support/transport';
import { Outcome, Scenario, Trace, explore } from './support/interleave';
import {
  STATUS_TTL_MS,
  createPipelineClient,
  deliveryIndex,
  describeOutcome,
  expectExplored,
  actorNames,
  SCENARIO_TIMEOUT_MS,
  scenarioOptions,
  statusPayload,
  widths,
} from './support/world';

interface World {
  client: EsiClient;
}

interface WithMeta {
  data: { players: number };
  meta: { etag?: string; fromCache: boolean; stale: boolean };
}

type Refresh = '200' | '304';

function metaOf(outcome: Outcome | undefined): WithMeta | undefined {
  return outcome?.ok ? (outcome.value as WithMeta) : undefined;
}

/** Players the cache holds once the refresh has been delivered. */
function refreshedPlayers(refresh: Refresh): number {
  return refresh === '200' ? 2 : 1;
}

function scenario(
  name: string,
  refresh: Refresh,
  width: number,
): Scenario<World> {
  const names = actorNames(width);
  const call = (w: World) => w.client.status.withMetadata().getStatus();
  const refreshResponse: HttpResponse =
    refresh === '200'
      ? { headers: { etag: '"v2"' }, body: statusPayload(2) }
      : { status: 304, headers: { etag: '"v1"' } };
  return {
    name,
    setup: async () => {
      const client = createPipelineClient({
        enableRequestDeduplication: false,
      });
      queueResponse({ headers: { etag: '"v1"' }, body: statusPayload(1) });
      await client.status.getStatus();
      await jest.advanceTimersByTimeAsync(STATUS_TTL_MS + 1_000);
      return { client };
    },
    teardown: (w) => w.client.shutdown(),
    actors: names.map((actor) => ({ name: actor, run: call })),
    followUp: [{ name: 'fresh', run: call }],
    respond: (request) =>
      request.ordinal === 1
        ? refreshResponse
        : { status: 503, body: { error: 'service unavailable' } },
    invariants: {
      'a caller settling before the refresh arrived gets the old body flagged stale':
        (trace: Trace) => {
          const arrived = deliveryIndex(trace, 1);
          for (const actor of names) {
            const settled = trace.events.findIndex(
              (e) => e.kind === 'settle' && e.actor === actor,
            );
            if (settled > arrived) continue;
            const result = metaOf(trace.outcomes.get(actor));
            if (!result?.meta.stale || result.data.players !== 1) {
              return `${actor} settled before the refresh arrived and ${result ? `resolved players ${result.data.players}, stale ${result.meta.stale}` : describeOutcome(trace.outcomes.get(actor))}`;
            }
          }
          return undefined;
        },
      'a caller settling after the refresh arrived gets the refreshed body': (
        trace,
      ) => {
        const arrived = deliveryIndex(trace, 1);
        for (const actor of names) {
          const settled = trace.events.findIndex(
            (e) => e.kind === 'settle' && e.actor === actor,
          );
          if (settled < arrived) continue;
          const players = metaOf(trace.outcomes.get(actor))?.data.players;
          if (players !== refreshedPlayers(refresh)) {
            return `${actor} settled after the refresh arrived but ${describeOutcome(trace.outcomes.get(actor))}`;
          }
        }
        return undefined;
      },
      'exactly the callers answered with a 503 are flagged stale': (trace) => {
        const failures = trace.requests.filter(
          (r) => r.response?.status === 503,
        ).length;
        const stale = names.filter(
          (a) => metaOf(trace.outcomes.get(a))?.meta.stale,
        ).length;
        return stale === failures
          ? undefined
          : `${stale} responses flagged stale for ${failures} 503s`;
      },
      'a 503 is served stale without a retry': (trace) => {
        const concurrent = trace.requests.filter(
          (r) => r.phase === 'concurrent',
        ).length;
        return concurrent <= width
          ? undefined
          : `${concurrent} requests were sent for ${width} calls`;
      },
      'a call inside the TTL afterwards gets the refreshed entry without a request':
        (trace) => {
          const fresh = metaOf(trace.outcomes.get('fresh'));
          const sent = trace.requests.filter((r) => r.phase === 'follow-up');
          if (sent.length > 0) {
            return `fresh sent ${sent.length} request(s)`;
          }
          return fresh?.meta.fromCache &&
            !fresh.meta.stale &&
            fresh.data.players === refreshedPlayers(refresh)
            ? undefined
            : `fresh ${describeOutcome(trace.outcomes.get('fresh'))}`;
        },
    },
  };
}

jest.setTimeout(SCENARIO_TIMEOUT_MS);

/** Exhaustive schedule counts, by refresh and number of calls. */
const PINNED: Record<string, number> = {
  '200/2': 6,
  '200/3': 72,
  '304/2': 6,
  '304/3': 72,
};

describe('composition: stale-on-error while the entry is being refreshed', () => {
  describe.each(widths())('%i calls', (width) => {
    it.each(['200', '304'] as const)(
      'a 503 racing a %s refresh of the same status entry',
      async (refresh) => {
        const testName = `${width} calls a 503 racing a ${refresh} refresh of the same status entry`;
        const options = scenarioOptions(testName);
        const report = await explore(
          scenario(testName, refresh, width),
          options,
        );
        expectExplored(report, PINNED[`${refresh}/${width}`]!, options);
      },
    );
  });
});
