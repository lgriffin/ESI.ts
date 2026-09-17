/**
 * Composition: deduplication when the shared in-flight request fails.
 *
 * Two identical status calls may join one in-flight request. When that
 * request fails, every caller that joined it gets the failure, the failure is
 * neither kept in the deduplicator nor written to the ETag cache, and the
 * next call makes a fresh, unconditional request. With a retryable failure
 * the joiners' retries coalesce again and all of them get the recovery.
 *
 * Backs these Rules in tests/bdd/features/core/0051-resilience.feature:
 *   - "If a shared in-flight GET request fails, then the EsiClient shall
 *     reject every caller that joined it."
 *   - "When an identical GET request is issued after the first has settled,
 *     the EsiClient shall issue a new HTTP request."
 */
import { EsiClient } from '../../../src/EsiClient';
import { Scenario, Trace, explore } from './support/interleave';
import {
  createPipelineClient,
  deliveryIndex,
  describeOutcome,
  eventIndex,
  expectExplored,
  rejectedStatus,
  scenarioOptions,
  statusPayload,
} from './support/world';

interface World {
  client: EsiClient;
}

const ACTORS = ['A', 'B'];

function startedBeforeFirstDelivery(trace: Trace, actor: string): boolean {
  const start = eventIndex(
    trace,
    (e) => e.kind === 'start' && e.actor === actor,
  );
  return start < deliveryIndex(trace, 1);
}

function resolvedPlayers(trace: Trace, actor: string): number | undefined {
  const outcome = trace.outcomes.get(actor);
  return outcome?.ok
    ? (outcome.value as { players: number }).players
    : undefined;
}

function scenario(name: string, failure: 500 | 503): Scenario<World> {
  return {
    name,
    setup: async () => ({ client: createPipelineClient() }),
    teardown: (w) => w.client.shutdown(),
    actors: ACTORS.map((actor) => ({
      name: actor,
      run: (w: World) => w.client.status.getStatus(),
    })),
    followUp: [{ name: 'late', run: (w) => w.client.status.getStatus() }],
    respond: (request) =>
      request.ordinal === 1
        ? { status: failure, body: { error: 'shared request failed' } }
        : { headers: { etag: '"v1"' }, body: statusPayload(1) },
    invariants: {
      'no request carries If-None-Match, because nothing was cached from the failure':
        (trace) => {
          const conditional = trace.requests.filter((r) => r.ifNoneMatch);
          return conditional.length === 0
            ? undefined
            : conditional
                .map((r) => `#${r.ordinal} sent If-None-Match ${r.ifNoneMatch}`)
                .join('; ');
        },
      ...(failure === 500
        ? {
            'every caller that joined the failing request rejects with its 500':
              (trace: Trace) => {
                for (const actor of ACTORS) {
                  if (!startedBeforeFirstDelivery(trace, actor)) continue;
                  const outcome = trace.outcomes.get(actor);
                  if (rejectedStatus(outcome) !== 500) {
                    return `${actor} joined request #1 but ${describeOutcome(outcome)}`;
                  }
                }
                return undefined;
              },
            'a caller that starts after the failure makes its own request and resolves':
              (trace: Trace) => {
                const late = ACTORS.filter(
                  (a) => !startedBeforeFirstDelivery(trace, a),
                );
                const concurrent = trace.requests.filter(
                  (r) => r.phase === 'concurrent',
                ).length;
                if (concurrent !== 1 + (late.length > 0 ? 1 : 0)) {
                  return `${concurrent} requests for ${late.length} caller(s) starting after the failure`;
                }
                for (const actor of late) {
                  if (resolvedPlayers(trace, actor) !== 1) {
                    return `${actor} started after the failure but ${describeOutcome(trace.outcomes.get(actor))}`;
                  }
                }
                return undefined;
              },
          }
        : {
            'every caller resolves with the recovery its retry fetched': (
              trace: Trace,
            ) => {
              for (const actor of ACTORS) {
                if (resolvedPlayers(trace, actor) !== 1) {
                  return `${actor} ${describeOutcome(trace.outcomes.get(actor))}`;
                }
              }
              return undefined;
            },
            'a retry is answered from the cache once another caller has cached the recovery':
              (trace: Trace) => {
                const firstSuccess = trace.events.findIndex(
                  (e) => e.kind === 'deliver' && e.ordinal !== 1,
                );
                if (firstSuccess === -1) return undefined;
                const sentAfter = trace.events
                  .slice(firstSuccess + 1)
                  .filter((e) => e.kind === 'send');
                return sentAfter.length === 0
                  ? undefined
                  : `${sentAfter.map((e) => e.label).join('; ')} after a fresh 200 was cached`;
              },
            'the retries of callers that joined the failure coalesce': (
              trace: Trace,
            ) => {
              const concurrent = trace.requests.filter(
                (r) => r.phase === 'concurrent',
              ).length;
              return concurrent <= 2
                ? undefined
                : `${concurrent} requests; the retries should share one`;
            },
          }),
      'the call after both settle resolves, fetching only if nothing good was cached':
        (trace) => {
          const late = trace.outcomes.get('late');
          if (resolvedPlayers(trace, 'late') !== 1) {
            return `late ${describeOutcome(late)}`;
          }
          const cachedSuccess = trace.requests.some(
            (r) => r.phase === 'concurrent' && r.ordinal > 1,
          );
          const lateRequests = trace.requests.filter(
            (r) => r.phase === 'follow-up',
          ).length;
          const expected = cachedSuccess ? 0 : 1;
          return lateRequests === expected
            ? undefined
            : `late sent ${lateRequests} request(s), expected ${expected} (${cachedSuccess ? 'a 200 was cached' : 'only the failure was seen'})`;
        },
    },
  };
}

describe('composition: deduplication when the shared request fails', () => {
  it.each([
    [500, 'a non-retryable 500', 4],
    [503, 'a retryable 503', 10],
  ] as const)('two status calls sharing %s', async (failure, label, pinned) => {
    const testName = `two status calls sharing ${failure}`;
    const options = scenarioOptions(testName);
    const report = await explore(
      scenario(`two status calls sharing ${label}`, failure),
      options,
    );
    expectExplored(report, pinned, options);
  });
});
