import {
  cacheResponse,
  currentWriteGeneration,
  invalidateAfterWrite,
} from '../../../../src/core/requestPipeline/cachePolicy';
import { ApiClient } from '../../../../src/core/ApiClient';
import { ETagCacheManager } from '../../../../src/core/cache/ETagCacheManager';
import { ParsedHeaders } from '../../../../src/core/util/headersUtil';

const BASE_URL = 'https://esi.evetech.net';
const CONTACTS = 'characters/1/contacts';
const CONTACTS_URL = `${BASE_URL}/${CONTACTS}`;
const PARSED = { raw: {}, etag: '"before"' } as unknown as ParsedHeaders;

describe('requestPipeline/cachePolicy write generation', () => {
  let client: ApiClient;
  let cache: ETagCacheManager;
  const resolveCache = (c: ApiClient) => c.getCache();

  const storeRead = (generation: number | undefined) =>
    cacheResponse(
      client,
      CONTACTS_URL,
      'GET',
      CONTACTS,
      PARSED,
      [{ contact_id: 2 }],
      true,
      resolveCache,
      undefined,
      false,
      generation,
    );

  beforeEach(() => {
    client = new ApiClient('test', BASE_URL);
    cache = new ETagCacheManager({ maxEntries: 100, defaultTtl: 60000 });
    client.setCache(cache);
  });

  afterEach(() => cache.shutdown());

  it('does not store a read whose path a write invalidated while it was in flight', () => {
    const sentAt = currentWriteGeneration(client, resolveCache);
    invalidateAfterWrite(
      client,
      'DELETE',
      `${CONTACTS}?contact_ids=2`,
      resolveCache,
    );

    storeRead(sentAt);

    expect(cache.get(CONTACTS_URL)).toBeNull();
  });

  it('stores a read when the write in flight touched a different path', () => {
    const sentAt = currentWriteGeneration(client, resolveCache);
    invalidateAfterWrite(client, 'POST', 'characters/1/fittings', resolveCache);

    storeRead(sentAt);

    expect(cache.get(CONTACTS_URL)?.etag).toBe('"before"');
  });

  it('stores a read sent after the write completed', () => {
    invalidateAfterWrite(client, 'DELETE', CONTACTS, resolveCache);

    storeRead(currentWriteGeneration(client, resolveCache));

    expect(cache.get(CONTACTS_URL)?.etag).toBe('"before"');
  });

  it('does not store a read that outlived more writes than the log keeps', () => {
    const sentAt = currentWriteGeneration(client, resolveCache);
    for (let i = 0; i < 65; i++) {
      invalidateAfterWrite(
        client,
        'POST',
        `characters/${100 + i}/fittings`,
        resolveCache,
      );
    }

    storeRead(sentAt);

    expect(cache.get(CONTACTS_URL)).toBeNull();
  });

  it('stores a read from a caller that passes no generation', () => {
    invalidateAfterWrite(client, 'DELETE', CONTACTS, resolveCache);

    storeRead(undefined);

    expect(cache.get(CONTACTS_URL)?.etag).toBe('"before"');
  });

  it('counts writes per cache, starting at zero', () => {
    const other = new ApiClient('other', BASE_URL);
    const otherCache = new ETagCacheManager();
    other.setCache(otherCache);

    invalidateAfterWrite(client, 'PUT', CONTACTS, resolveCache);
    invalidateAfterWrite(client, 'GET', CONTACTS, resolveCache);

    expect(currentWriteGeneration(client, resolveCache)).toBe(1);
    expect(currentWriteGeneration(other, resolveCache)).toBe(0);
    expect(
      currentWriteGeneration(new ApiClient('none', BASE_URL), resolveCache),
    ).toBe(0);
    otherCache.shutdown();
  });
});
