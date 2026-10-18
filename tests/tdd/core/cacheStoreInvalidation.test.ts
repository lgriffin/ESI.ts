/**
 * Cross-process invalidation through a shared CacheStore (#676): a store
 * with `publishInvalidation`/`onInvalidate` carries the paths a write
 * invalidates, and `clear()`, to every other holder.
 */
import fetchMock from 'jest-fetch-mock';
import { EsiClient } from '../../../src/EsiClient';
import { CacheStoreCache } from '../../../src/core/cache/CacheStoreCache';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import {
  invalidatedSince,
  writeGenerationOf,
} from '../../../src/core/cache/writeLog';
import type { CacheStore } from '../../../src/core/ports/CacheStore';
import { SharedMemoryCacheStore } from '../helpers/SharedMemoryCacheStore';

fetchMock.enableMocks();

const SEAM = {
  baseUrl: 'https://esi.evetech.net',
  logLevel: 'silent',
  retryConfig: { maxRetries: 0 },
  rateLimiterConfig: { minDelayMs: 0 },
  accessToken: 'token',
} as const;

const CONTACTS = [
  { contact_id: 2112625428, contact_type: 'character', standing: 5 },
];

function contactsAnswer(etag: string): void {
  fetchMock.mockResponseOnce(JSON.stringify(CONTACTS), {
    headers: { 'content-type': 'application/json', etag },
  });
}

function addedAnswer(): void {
  fetchMock.mockResponseOnce(JSON.stringify([2112625428]), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
}

describe('CacheStoreCache over a store that carries invalidations', () => {
  it('publishes the path a write invalidates and each clear', () => {
    const shared = new SharedMemoryCacheStore();
    const cache = new CacheStoreCache(shared.connect());

    cache.deleteByPath('characters/1/contacts');
    cache.clear();

    expect(shared.published).toEqual([
      { kind: 'path', path: 'characters/1/contacts' },
      { kind: 'clear' },
    ]);
  });

  it('drops the keys it wrote under a path another holder invalidated, and records the write', () => {
    const shared = new SharedMemoryCacheStore();
    const here = new CacheStoreCache(shared.connect());
    const there = new CacheStoreCache(shared.connect());
    const key =
      'https://esi.evetech.net/characters/1/contacts/?datasource=tranquility';
    here.set(key, '"c1"', CONTACTS, {});
    here.set('https://esi.evetech.net/status/', '"s1"', {}, {});
    const sentAt = writeGenerationOf(here);

    there.deleteByPath('characters/1/contacts');

    expect(here.get(key)).toBeNull();
    expect(here.get('https://esi.evetech.net/status/')).not.toBeNull();
    expect(invalidatedSince(here, sentAt, key)).toBe(true);
    expect(
      invalidatedSince(here, sentAt, 'https://esi.evetech.net/status/'),
    ).toBe(false);
  });

  it('stops every in-flight read when another holder clears, and keeps keys it can still delete', () => {
    const shared = new SharedMemoryCacheStore();
    const here = new CacheStoreCache(shared.connect());
    const other = shared.connect();
    const sentAt = writeGenerationOf(here);
    // Written after the store was cleared, before the clear event arrived.
    here.set('https://esi.evetech.net/status/', '"s1"', {}, {});

    other.publishInvalidation!({ kind: 'clear' });

    expect(
      invalidatedSince(here, sentAt, 'https://esi.evetech.net/status/'),
    ).toBe(true);
    expect(here.deleteByPath('status')).toBe(1);
    expect(shared.entries.size).toBe(0);
  });

  it('detaches matching in-flight reads from an attached deduplicator on a remote write', async () => {
    const shared = new SharedMemoryCacheStore();
    const here = new CacheStoreCache(shared.connect());
    const there = new CacheStoreCache(shared.connect());
    const deduplicator = new RequestDeduplicator();
    here.attachDeduplicator(deduplicator);
    const answers: ((value: string) => void)[] = [];
    const before = deduplicator.dedupe(
      'characters/1/contacts',
      () =>
        new Promise<string>((resolve) => {
          answers.push(resolve);
        }),
    );
    const status = deduplicator.dedupe('status', () => Promise.resolve('ok'));

    there.deleteByPath('characters/1/contacts');
    const after = deduplicator.dedupe('characters/1/contacts', () =>
      Promise.resolve('post-write'),
    );
    answers[0]!('pre-write');

    expect(await before).toBe('pre-write');
    expect(await after).toBe('post-write');
    expect(await status).toBe('ok');
  });

  it('keeps the write and its local invalidation when publishing throws', () => {
    const shared = new SharedMemoryCacheStore();
    const store: CacheStore = {
      ...shared.connect(),
      publishInvalidation: () => {
        throw new Error('bus down');
      },
    };
    const cache = new CacheStoreCache(store);
    cache.set('https://esi.evetech.net/a/1', '"e"', {}, {});

    expect(cache.deleteByPath('a/1')).toBe(1);
    expect(() => cache.clear()).not.toThrow();
  });

  it('stops listening when it shuts down', () => {
    const shared = new SharedMemoryCacheStore();
    const cache = new CacheStoreCache(shared.connect());
    expect(shared.subscribers).toBe(1);

    cache.shutdown();

    expect(shared.subscribers).toBe(0);
  });

  it('works as before over a store without the pair', () => {
    const shared = new SharedMemoryCacheStore();
    const full = shared.connect();
    const plain: CacheStore = {
      get: full.get,
      set: full.set,
      delete: full.delete,
      clear: full.clear,
      shutdown: full.shutdown,
    };
    const cache = new CacheStoreCache(plain);
    cache.set('https://esi.evetech.net/a/1', '"e"', {}, {});

    expect(cache.deleteByPath('a/1')).toBe(1);
    expect(shared.published).toEqual([]);
  });
});

describe('two clients sharing one store across "processes"', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('a write through one client stops the other serving the read it cached', async () => {
    const shared = new SharedMemoryCacheStore();
    const reader = new EsiClient({ ...SEAM, cache: shared.connect() });
    const writer = new EsiClient({ ...SEAM, cache: shared.connect() });
    contactsAnswer('"c1"');
    addedAnswer();
    contactsAnswer('"c2"');

    await reader.contacts.getCharacterContacts(1);
    await reader.contacts.getCharacterContacts(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await writer.contacts.postCharacterContacts(1, 5, [2112625428]);
    await reader.contacts.getCharacterContacts(1);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    reader.shutdown();
    writer.shutdown();
  });

  it("a write through one client detaches the other client's matching in-flight reads", () => {
    const shared = new SharedMemoryCacheStore();
    const reader = new EsiClient({ ...SEAM, cache: shared.connect() });
    const writerCache = new CacheStoreCache(shared.connect());
    const inflight = (
      reader as unknown as {
        apiClient: { getDeduplicator(): RequestDeduplicator };
      }
    ).apiClient.getDeduplicator();
    const detach = jest.spyOn(inflight, 'detachByPath');

    writerCache.deleteByPath('characters/1/contacts');

    expect(detach).toHaveBeenCalledWith('characters/1/contacts');
    reader.shutdown();
  });

  it('without the pair, the other client keeps serving its entry', async () => {
    const shared = new SharedMemoryCacheStore();
    const strip = (s: CacheStore): CacheStore => ({
      get: s.get,
      set: s.set,
      delete: s.delete,
      clear: s.clear,
      shutdown: s.shutdown,
    });
    const reader = new EsiClient({ ...SEAM, cache: strip(shared.connect()) });
    const writer = new EsiClient({ ...SEAM, cache: strip(shared.connect()) });
    contactsAnswer('"c1"');
    addedAnswer();

    await reader.contacts.getCharacterContacts(1);
    await writer.contacts.postCharacterContacts(1, 5, [2112625428]);
    await reader.contacts.getCharacterContacts(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    reader.shutdown();
    writer.shutdown();
  });
});
