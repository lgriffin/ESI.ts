/**
 * Composition: a write invalidating the cache while a read is in flight.
 *
 * A character's contact list is read while a DELETE removes one contact. The
 * server applies the write when the DELETE reaches it, so a read that reached
 * the server first is answered with the pre-write list (or a 304 for the
 * pre-write ETag) and a read that reached it after with the post-write list;
 * the responses can then arrive in either order. Whatever the order:
 *
 *   - the read resolves with the list the server sent for it, and a 304 that
 *     arrives after the write evicted its cached body is not an error;
 *   - once the write has completed, the next read returns the post-write list,
 *     so a pre-write response arriving after the write must not be cached.
 *
 * The invalidation itself is src/core/requestPipeline/cachePolicy.ts
 * invalidateAfterWrite. No Rule in tests/bdd/features states it yet; see the
 * tier's AGENTS.md.
 */
import { EsiClient } from '../../../src/EsiClient';
import { HttpResponse, queueResponse } from '../../bdd/support/transport';
import { Scenario, SentRequest, Trace, explore } from './support/interleave';
import {
  CHARACTER_ID,
  CONTACTS_TTL_MS,
  contactsPayload,
  createPipelineClient,
  describeOutcome,
  expectExplored,
  scenarioOptions,
} from './support/world';

interface World {
  client: EsiClient;
}

type Cache = 'cold' | 'revalidating';

const BEFORE = [1, 2];
const AFTER = [1];

function reachedServerAfterWrite(request: SentRequest, trace: Trace): boolean {
  return trace.requests.some(
    (r) => r.method === 'DELETE' && r.ordinal < request.ordinal,
  );
}

function contactIds(value: unknown): number[] | undefined {
  return Array.isArray(value)
    ? (value as { contact_id: number }[]).map((c) => c.contact_id)
    : undefined;
}

function scenario(name: string, cache: Cache): Scenario<World> {
  const read = (w: World) =>
    w.client.contacts.getCharacterContacts(CHARACTER_ID);
  return {
    name,
    setup: async () => {
      const client = createPipelineClient();
      if (cache === 'revalidating') {
        queueResponse({
          headers: { etag: '"before"' },
          body: contactsPayload(BEFORE),
        });
        await read({ client });
        await jest.advanceTimersByTimeAsync(CONTACTS_TTL_MS + 1_000);
      }
      return { client };
    },
    teardown: (w) => w.client.shutdown(),
    actors: [
      { name: 'read', run: read },
      {
        name: 'write',
        run: (w) =>
          w.client.contacts.deleteCharacterContacts(CHARACTER_ID, [2]),
      },
    ],
    followUp: [{ name: 'reread', run: read }],
    respond: (request, _world, trace): HttpResponse => {
      if (request.method === 'DELETE') return { status: 204 };
      const afterWrite =
        request.phase === 'follow-up' ||
        reachedServerAfterWrite(request, trace);
      if (!afterWrite && request.ifNoneMatch === '"before"') {
        return { status: 304, headers: { etag: '"before"' } };
      }
      return afterWrite
        ? { headers: { etag: '"after"' }, body: contactsPayload(AFTER) }
        : { headers: { etag: '"before"' }, body: contactsPayload(BEFORE) };
    },
    invariants: {
      'the write completes with one DELETE': (trace) => {
        const deletes = trace.requests.filter((r) => r.method === 'DELETE');
        const write = trace.outcomes.get('write');
        return write?.ok && deletes.length === 1
          ? undefined
          : `write ${describeOutcome(write)} after ${deletes.length} DELETE request(s)`;
      },
      'the read resolves with the list the server sent for it': (trace) => {
        const outcome = trace.outcomes.get('read');
        const ids = outcome?.ok ? contactIds(outcome.value) : undefined;
        if (!ids) return `read ${describeOutcome(outcome)}`;
        // The body the server last sent for this read: a 304 stands for the
        // pre-write list its ETag names.
        const gets = trace.requests.filter(
          (r) => r.method === 'GET' && r.phase === 'concurrent',
        );
        const last = gets[gets.length - 1];
        if (!last) return 'the read sent no request';
        const expected =
          last.response?.status === 304 || !reachedServerAfterWrite(last, trace)
            ? BEFORE
            : AFTER;
        return ids.join(',') === expected.join(',')
          ? undefined
          : `read resolved contacts ${ids.join(',')}, but the server last sent ${expected.join(',')} for it`;
      },
      'a read after the write has completed returns the post-write list': (
        trace,
      ) => {
        const outcome = trace.outcomes.get('reread');
        const ids = outcome?.ok ? contactIds(outcome.value) : undefined;
        return ids?.join(',') === AFTER.join(',')
          ? undefined
          : `reread ${ids ? `resolved contacts ${ids.join(',')}` : describeOutcome(outcome)}`;
      },
    },
  };
}

describe('composition: write invalidation racing an in-flight read', () => {
  it.each([['cold', 6]] as const)(
    'a contact DELETE racing a contact list read with a %s cache',
    async (cache, pinned) => {
      const testName = `a contact DELETE racing a contact list read with a ${cache} cache`;
      const options = scenarioOptions(testName);
      const report = await explore(scenario(testName, cache), options);
      expectExplored(report, pinned, options);
    },
  );
});
