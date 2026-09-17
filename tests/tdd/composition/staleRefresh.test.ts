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
  scenarioOptions,
  statusPayload,
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

function scenario(name: string, refresh: Refresh): Scenario<World> {
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
    actors: [
      { name: 'A', run: call },
      { name: 'B', run: call },
    ],
    followUp: [{ name: 'fresh', run: call }],
    respond: (request) =>
      request.ordinal === 1
        ? refreshResponse
        : { status: 503, body: { error: 'service unavailable' } },
    invariants: {
      'the 503 caller gets the body the cache holds when the 503 arrives, flagged stale':
        (trace: Trace) => {
          const failed = trace.requests.find((r) => r.response?.status === 503);
          const results = ['A', 'B'].map((a) => metaOf(trace.outcomes.get(a)));
          if (results.some((r) => !r)) {
            return ['A', 'B']
              .map((a) => `${a} ${describeOutcome(trace.outcomes.get(a))}`)
              .join('; ');
          }
          const stale = results.filter((r) => r!.meta.stale);
          if (!failed) {
            return stale.length === 0
              ? undefined
              : 'a response was flagged stale although no request failed';
          }
          if (stale.length !== 1) {
            return `${stale.length} responses flagged stale for one 503`;
          }
          const refreshFirst =
            deliveryIndex(trace, 1) < deliveryIndex(trace, failed.ordinal);
          const expected = refreshFirst ? refreshedPlayers(refresh) : 1;
          return stale[0]!.data.players === expected
            ? undefined
            : `stale response carried players ${stale[0]!.data.players}, but the cache held players ${expected} when the 503 arrived`;
        },
      'the refreshed caller gets the refreshed body, not flagged stale': (
        trace,
      ) => {
        const fresh = ['A', 'B']
          .map((a) => metaOf(trace.outcomes.get(a)))
          .filter((r) => r && !r.meta.stale);
        return fresh.length >= 1 &&
          fresh.every((r) => r!.data.players === refreshedPlayers(refresh))
          ? undefined
          : `non-stale callers resolved players ${fresh.map((r) => r?.data.players).join(', ')}`;
      },
      'a 503 is served stale without a retry': (trace) => {
        const concurrent = trace.requests.filter(
          (r) => r.phase === 'concurrent',
        ).length;
        return concurrent <= 2
          ? undefined
          : `${concurrent} requests were sent for two calls`;
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

describe('composition: stale-on-error while the entry is being refreshed', () => {
  it.each([
    ['200', 6],
    ['304', 6],
  ] as const)(
    'a 503 racing a %s refresh of the same status entry',
    async (refresh, pinned) => {
      const testName = `a 503 racing a ${refresh} refresh of the same status entry`;
      const options = scenarioOptions(testName);
      const report = await explore(scenario(testName, refresh), options);
      expectExplored(report, pinned, options);
    },
  );
});
