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
  meta: { etag?: string; fromCache: boolean };
}

const ETAG_FOR_PLAYERS: Record<number, string> = { 1: '"v1"', 2: '"v2"' };

function metaOf(outcome: Outcome | undefined): WithMeta | undefined {
  return outcome?.ok ? (outcome.value as WithMeta) : undefined;
}

function scenario(name: string, width: number): Scenario<World> {
  const names = actorNames(width);
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
    actors: names.map((actor) => ({ name: actor, run: call })),
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
        ? { status: 200, headers: { etag: '"v2"' }, body: statusPayload(2) }
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
        for (const actor of [...names, 'fresh', 'next']) {
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
      'a caller settling after the 200 arrived gets the newer body, and one settling before it the older':
        (trace) => {
          const arrived = trace.events.findIndex(
            (e) =>
              e.kind === 'deliver' &&
              trace.requests[e.ordinal! - 1]!.response?.status === 200,
          );
          if (arrived === -1) return 'the 200 was never delivered';
          for (const actor of names) {
            const settled = trace.events.findIndex(
              (e) => e.kind === 'settle' && e.actor === actor,
            );
            const players = metaOf(trace.outcomes.get(actor))?.data.players;
            const expected = settled > arrived ? 2 : 1;
            if (players !== expected) {
              return `${actor} settled ${settled > arrived ? 'after' : 'before'} the 200 for players 2 arrived but resolved players ${players}`;
            }
          }
          return undefined;
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

jest.setTimeout(SCENARIO_TIMEOUT_MS);

/** Exhaustive schedule counts, by number of calls. */
const PINNED: Record<number, number> = { 2: 6, 3: 66 };

describe('composition: ETag cache write ordering', () => {
  it.each(widths())(
    '%i calls: a 304 for the old ETag never overwrites a concurrent 200 for the new one',
    async (width) => {
      const testName = `${width} calls: a 304 for the old ETag never overwrites a concurrent 200 for the new one`;
      const options = scenarioOptions(testName);
      const report = await explore(scenario(testName, width), options);
      expectExplored(report, PINNED[width]!, options);
    },
  );
});
