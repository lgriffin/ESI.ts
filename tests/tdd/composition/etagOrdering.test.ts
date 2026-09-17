/**
 * Composition: ETag cache write ordering.
 *
 * The cached server status has passed its spec TTL, so two concurrent calls
 * both revalidate with If-None-Match. One is answered with a full 200 carrying
 * a new ETag, the other with a 304 for the old one, and the two responses may
 * arrive in either order. Whichever arrives last, the 304 must not undo the
 * 200: the cache keeps the newer body with its own ETag, every caller's
 * metadata names the ETag of the body it was given, and the next
 * revalidation asks about the newer ETag.
 *
 * Backs these Rules in tests/bdd/features/core/0050-etag-caching.feature:
 *   - "When a response carrying an ETag header is received, the ETag cache
 *     shall store the response body against the requested endpoint."
 *   - "When a revalidation is answered with HTTP 304, the ETag cache shall
 *     restart the freshness TTL of the cached entry."
 */
import { EsiClient } from '../../../src/EsiClient';
import { HttpResponse, queueResponse } from '../../bdd/support/transport';
import { Outcome, Scenario, Trace, explore } from './support/interleave';
import {
  STATUS_TTL_MS,
  createPipelineClient,
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
  meta: { etag?: string; fromCache: boolean };
}

const ETAG_FOR_PLAYERS: Record<number, string> = { 1: '"v1"', 2: '"v2"' };

function metaOf(outcome: Outcome | undefined): WithMeta | undefined {
  return outcome?.ok ? (outcome.value as WithMeta) : undefined;
}

/** Statuses of the concurrent responses, in the order they arrived. */
function deliveredStatuses(trace: Trace): number[] {
  return trace.events
    .filter((e) => e.kind === 'deliver')
    .map((e) => trace.requests[e.ordinal! - 1]!)
    .filter((r) => r.phase === 'concurrent')
    .map((r) => r.response!.status ?? 200);
}

function scenario(name: string): Scenario<World> {
  const call = (w: World) => w.client.status.withMetadata().getStatus();
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
    followUp: [
      { name: 'fresh', run: call },
      {
        name: 'next',
        run: async (w) => {
          await jest.advanceTimersByTimeAsync(STATUS_TTL_MS + 1_000);
          return call(w);
        },
      },
    ],
    respond: (request): HttpResponse => {
      if (request.phase === 'follow-up') {
        return {
          status: 304,
          headers: { etag: request.ifNoneMatch ?? '"none"' },
        };
      }
      return request.ordinal === 1
        ? { headers: { etag: '"v2"' }, body: statusPayload(2) }
        : { status: 304, headers: { etag: '"v1"' } };
    },
    invariants: {
      'both concurrent revalidations carry the old ETag': (trace) => {
        const wrong = trace.requests.filter(
          (r) => r.phase === 'concurrent' && r.ifNoneMatch !== '"v1"',
        );
        return wrong.length === 0
          ? undefined
          : wrong
              .map((r) => `#${r.ordinal} If-None-Match ${r.ifNoneMatch}`)
              .join('; ');
      },
      'every caller resolves with metadata naming the ETag of its body': (
        trace,
      ) => {
        for (const actor of ['A', 'B', 'fresh', 'next']) {
          const result = metaOf(trace.outcomes.get(actor));
          if (!result) {
            return `${actor} ${describeOutcome(trace.outcomes.get(actor))}`;
          }
          const expected = ETAG_FOR_PLAYERS[result.data.players];
          if (result.meta.etag !== expected) {
            return `${actor} got players ${result.data.players} (ETag ${expected}) with metadata ETag ${result.meta.etag}`;
          }
        }
        return undefined;
      },
      'a 304 delivered after the 200 serves the newer body': (trace) => {
        const order = deliveredStatuses(trace);
        if (order.join(',') !== '200,304') return undefined;
        const bodies = ['A', 'B'].map(
          (a) => metaOf(trace.outcomes.get(a))?.data.players,
        );
        return bodies.every((p) => p === 2)
          ? undefined
          : `callers resolved players ${bodies.join(' and ')} after the 200 for players 2 was cached`;
      },
      'a call inside the TTL afterwards is served the newer body without a request':
        (trace) => {
          const fresh = metaOf(trace.outcomes.get('fresh'));
          if (!fresh?.meta.fromCache || fresh.data.players !== 2) {
            return `fresh ${describeOutcome(trace.outcomes.get('fresh'))}`;
          }
          const phase = trace.events.findIndex((e) => e.kind === 'phase');
          const nextStart = trace.events.findIndex(
            (e) => e.kind === 'start' && e.actor === 'next',
          );
          const sent = trace.events
            .slice(phase, nextStart)
            .filter((e) => e.kind === 'send');
          return sent.length === 0
            ? undefined
            : `fresh sent ${sent.map((e) => e.label).join('; ')}`;
        },
      'the next revalidation asks about the newer ETag and gets the newer body':
        (trace) => {
          const next = trace.requests.filter((r) => r.phase === 'follow-up');
          if (next.length !== 1) return `next sent ${next.length} requests`;
          if (next[0]!.ifNoneMatch !== '"v2"') {
            return `next revalidated with If-None-Match ${next[0]!.ifNoneMatch}`;
          }
          const players = metaOf(trace.outcomes.get('next'))?.data.players;
          return players === 2 ? undefined : `next resolved players ${players}`;
        },
    },
  };
}

describe('composition: ETag cache write ordering', () => {
  it('a 304 for the old ETag never overwrites a concurrent 200 for the new one', async () => {
    const testName =
      'a 304 for the old ETag never overwrites a concurrent 200 for the new one';
    const options = scenarioOptions(testName);
    const report = await explore(scenario(testName), options);
    expectExplored(report, 6, options);
  });
});
