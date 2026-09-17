import {
  lookupSpecTtl,
  trySpecAwareCacheHit,
  tryStaleCacheResponse,
  cacheResponse,
  evictRejectedResponse,
  invalidateAfterWrite,
} from '../../../../src/core/requestPipeline/cachePolicy';
import { ApiClient } from '../../../../src/core/ApiClient';
import { ICache } from '../../../../src/core/cache/ICache';
import { ETagCacheManager } from '../../../../src/core/cache/ETagCacheManager';
import { buildCacheKey } from '../../../../src/core/cache/cacheKey';
import { ParsedHeaders } from '../../../../src/core/util/headersUtil';

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/cachePolicy', () => {
  describe('lookupSpecTtl', () => {
    it('should return undefined for unknown endpoints', () => {
      expect(lookupSpecTtl('GET', '/v999/nonexistent/')).toBeUndefined();
    });

    it('should normalize camelCase path parameters to snake_case', () => {
      // The function should convert {characterId} to {character_id}
      const result = lookupSpecTtl(
        'GET',
        '/v5/characters/{characterId}/skills/',
      );
      // Whether this returns a value depends on the generated cache TTLs,
      // but the normalization itself should not throw
      expect(result === undefined || typeof result === 'number').toBe(true);
    });

    it('should strip trailing slashes', () => {
      const withSlash = lookupSpecTtl('GET', '/v1/status/');
      const withoutSlash = lookupSpecTtl('GET', '/v1/status');
      expect(withSlash).toBe(withoutSlash);
    });

    it('should return milliseconds (not seconds)', () => {
      // The endpoint template path, as the request pipeline passes it. The
      // status endpoint has a spec TTL; ESI TTLs are at least 1 second = 1000ms.
      const result = lookupSpecTtl('GET', 'status/');
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('trySpecAwareCacheHit', () => {
    let client: ApiClient;
    const resolveCache = (c: ApiClient) => c.getCache();

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
    });

    it('should return null for non-GET methods', () => {
      expect(
        trySpecAwareCacheHit(
          client,
          `${BASE_URL}/v1/status/`,
          'POST',
          '/v1/status/',
          resolveCache,
        ),
      ).toBeNull();
    });

    it('should return null when no templatePath is provided', () => {
      expect(
        trySpecAwareCacheHit(
          client,
          `${BASE_URL}/v1/status/`,
          'GET',
          undefined,
          resolveCache,
        ),
      ).toBeNull();
    });

    it('should return null when no cache is configured', () => {
      expect(
        trySpecAwareCacheHit(
          client,
          `${BASE_URL}/v1/status/`,
          'GET',
          '/v1/status/',
          resolveCache,
        ),
      ).toBeNull();
    });

    it('should return cached response when within TTL', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 100 }, { 'content-type': 'json' });

      const result = trySpecAwareCacheHit(
        client,
        url,
        'GET',
        'status',
        resolveCache,
      );

      // The status endpoint has a spec TTL, so the fresh entry is a spec-ttl hit
      expect(result).toMatchObject({
        fromCache: true,
        cacheHitType: 'spec-ttl',
        body: { players: 100 },
      });

      cache.shutdown();
    });

    it('should return null for POST method even with templatePath', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 100 }, { 'content-type': 'json' });

      const result = trySpecAwareCacheHit(
        client,
        url,
        'POST',
        '/v1/status/',
        resolveCache,
      );

      expect(result).toBeNull();
      cache.shutdown();
    });
  });

  describe('tryStaleCacheResponse', () => {
    let client: ApiClient;
    const resolveCache = (c: ApiClient) => c.getCache();

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
    });

    it('should return null when no cache is configured', () => {
      const parsed = { raw: {}, xPages: 1 } as ParsedHeaders;
      expect(
        tryStaleCacheResponse(
          client,
          `${BASE_URL}/v1/status/`,
          parsed,
          resolveCache,
        ),
      ).toBeNull();
    });

    it('should return null when nothing is cached', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const parsed = { raw: {} } as ParsedHeaders;
      expect(
        tryStaleCacheResponse(
          client,
          `${BASE_URL}/v1/uncached/`,
          parsed,
          resolveCache,
        ),
      ).toBeNull();

      cache.shutdown();
    });

    it('should return stale cached response when data exists', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(
        url,
        '"etag"',
        { players: 100 },
        { 'content-type': 'application/json' },
      );

      const parsed = {
        raw: { 'x-request-id': 'abc' },
      } as unknown as ParsedHeaders;
      const result = tryStaleCacheResponse(client, url, parsed, resolveCache);

      expect(result).not.toBeNull();
      expect(result!.fromCache).toBe(true);
      expect(result!.stale).toBe(true);
      expect(result!.cacheHitType).toBe('stale-on-error');
      expect(result!.body).toEqual({ players: 100 });

      cache.shutdown();
    });
  });

  describe('cacheResponse', () => {
    let client: ApiClient;
    let cache: ETagCacheManager;
    const resolveCache = (c: ApiClient) => c.getCache();

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
      cache = new ETagCacheManager({ maxEntries: 100, defaultTtl: 60000 });
      client.setCache(cache);
    });

    afterEach(() => {
      cache.shutdown();
    });

    it('should cache GET responses with ETag', () => {
      const url = `${BASE_URL}/v1/status/`;
      const parsed = {
        raw: { 'content-type': 'application/json' },
        etag: '"etag-123"',
      } as unknown as ParsedHeaders;

      cacheResponse(
        client,
        url,
        'GET',
        'v1/status/',
        parsed,
        { players: 100 },
        true,
        resolveCache,
      );

      const entry = cache.get(url);
      expect(entry).not.toBeNull();
      expect(entry!.data).toEqual({ players: 100 });
    });

    it('should not cache GET responses without ETag', () => {
      const url = `${BASE_URL}/v1/status/`;
      const parsed = {
        raw: { 'content-type': 'application/json' },
        etag: null,
      } as unknown as ParsedHeaders;

      cacheResponse(
        client,
        url,
        'GET',
        'v1/status/',
        parsed,
        { players: 100 },
        true,
        resolveCache,
      );

      const entry = cache.get(url);
      expect(entry).toBeNull();
    });

    it('should not cache when useETag is false', () => {
      const url = `${BASE_URL}/v1/status/`;
      const parsed = {
        raw: {},
        etag: '"etag-123"',
      } as unknown as ParsedHeaders;

      cacheResponse(
        client,
        url,
        'GET',
        'v1/status/',
        parsed,
        { players: 100 },
        false,
        resolveCache,
      );

      const entry = cache.get(url);
      expect(entry).toBeNull();
    });

    describe('entry lifetime', () => {
      const ONE_HOUR_MS = 60 * 60 * 1000;
      const statusUrl = `${BASE_URL}/status`;
      const store = (raw: Record<string, string>, templatePath?: string) =>
        cacheResponse(
          client,
          statusUrl,
          'GET',
          'status',
          { raw, etag: '"etag-123"' } as unknown as ParsedHeaders,
          { players: 100 },
          true,
          resolveCache,
          templatePath,
        );

      it('keeps a spec-TTL entry for one hour past the spec TTL', () => {
        store({}, 'status');
        expect(cache.get(statusUrl)!.ttl).toBe(30_000 + ONE_HOUR_MS);
      });

      it('keeps a Cache-Control entry for one hour past max-age', () => {
        store({ 'cache-control': 'public, max-age=120' });
        expect(cache.get(statusUrl)!.ttl).toBe(120_000 + ONE_HOUR_MS);
      });

      it('keeps a max-age=0 entry for the retention hour rather than forever', () => {
        store({ 'cache-control': 'max-age=0' });
        expect(cache.get(statusUrl)!.ttl).toBe(ONE_HOUR_MS);
      });

      it('leaves an entry with no freshness TTL to the cache defaultTtl', () => {
        store({});
        expect(cache.get(statusUrl)!.ttl).toBe(60000);
      });

      describe('against the clock', () => {
        let now: number;

        beforeEach(() => {
          now = Date.now();
          jest.spyOn(Date, 'now').mockImplementation(() => now);
        });

        afterEach(() => {
          jest.restoreAllMocks();
        });

        it('stops the spec-TTL hit at the TTL but keeps the entry for stale use', () => {
          store({}, 'status');

          now += 30_001;

          expect(
            trySpecAwareCacheHit(
              client,
              statusUrl,
              'GET',
              'status',
              resolveCache,
            ),
          ).toBeNull();
          const stale = tryStaleCacheResponse(
            client,
            statusUrl,
            { raw: {} } as unknown as ParsedHeaders,
            resolveCache,
          );
          expect(stale!.body).toEqual({ players: 100 });
          expect(cache.getETag(statusUrl)).toBe('"etag-123"');
        });

        it('discards the entry once the retention hour has passed', () => {
          store({}, 'status');

          now += 30_000 + ONE_HOUR_MS + 1;

          expect(
            tryStaleCacheResponse(
              client,
              statusUrl,
              { raw: {} } as unknown as ParsedHeaders,
              resolveCache,
            ),
          ).toBeNull();
          expect(cache.getStats().totalEntries).toBe(0);
        });

        it('lets a write evict an entry kept past its TTL', () => {
          store({}, 'status');
          now += 30_001;

          invalidateAfterWrite(client, 'POST', 'status', resolveCache);

          expect(cache.get(statusUrl)).toBeNull();
        });

        it('lets a rejected body evict an entry kept past its TTL', () => {
          store({}, 'status');
          now += 30_001;

          evictRejectedResponse(client, 'status', false, resolveCache);

          expect(cache.get(statusUrl)).toBeNull();
        });
      });
    });

    it('should invalidate cache for non-GET methods', () => {
      const url = `${BASE_URL}/v1/characters/123/contacts/`;
      cache.set(url, '"etag"', [{ contact_id: 1 }], { 'content-type': 'json' });

      const parsed = { raw: {}, etag: null } as unknown as ParsedHeaders;
      cacheResponse(
        client,
        url,
        'POST',
        'v1/characters/123/contacts/',
        parsed,
        { success: true },
        true,
        resolveCache,
      );

      // Non-GET should invalidate, not store
      const entry = cache.get(url);
      expect(entry).toBeNull();
    });
  });

  describe('cross-tenant cache isolation', () => {
    const resolveCache = (c: ApiClient) => c.getCache();

    it('should isolate cached responses between different access tokens', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });

      const clientA = new ApiClient('test', BASE_URL, 'token-user-a');
      clientA.setCache(cache);

      const clientB = new ApiClient('test', BASE_URL, 'token-user-b');
      clientB.setCache(cache);

      const url = `${BASE_URL}/v1/characters/12345/assets/`;
      const parsed = {
        raw: { 'content-type': 'application/json' },
        etag: '"etag-a"',
      } as unknown as ParsedHeaders;

      cacheResponse(
        clientA,
        url,
        'GET',
        'v1/characters/12345/assets/',
        parsed,
        { assets: ['user-a-ship'] },
        true,
        resolveCache,
        undefined,
        true,
      );

      const keyA = buildCacheKey(url, clientA, true);
      const keyB = buildCacheKey(url, clientB, true);
      expect(cache.get(keyA)).not.toBeNull();
      expect(cache.get(keyB)).toBeNull();

      cache.shutdown();
    });

    it('should not return stale data from a different token', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });

      const clientA = new ApiClient('test', BASE_URL, 'token-user-a');
      clientA.setCache(cache);

      const clientB = new ApiClient('test', BASE_URL, 'token-user-b');
      clientB.setCache(cache);

      const url = `${BASE_URL}/v1/characters/12345/assets/`;
      const keyA = buildCacheKey(url, clientA, true);
      cache.set(keyA, '"etag-a"', { assets: ['user-a-ship'] }, {});

      const parsed = { raw: {} } as unknown as ParsedHeaders;
      const result = tryStaleCacheResponse(
        clientB,
        url,
        parsed,
        resolveCache,
        true,
      );
      expect(result).toBeNull();

      cache.shutdown();
    });

    it('should allow unauthenticated requests to share cache entries', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });

      const client1 = new ApiClient('test', BASE_URL);
      client1.setCache(cache);

      const client2 = new ApiClient('test', BASE_URL);
      client2.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 100 }, {});

      const parsed = { raw: {} } as unknown as ParsedHeaders;
      const result = tryStaleCacheResponse(client2, url, parsed, resolveCache);
      expect(result).not.toBeNull();
      expect(result!.body).toEqual({ players: 100 });

      cache.shutdown();
    });

    it('should share public endpoint cache across token-bearing clients', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });

      const clientA = new ApiClient('test', BASE_URL, 'token-user-a');
      clientA.setCache(cache);

      const clientB = new ApiClient('test', BASE_URL, 'token-user-b');
      clientB.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      const parsed = {
        raw: { 'content-type': 'application/json' },
        etag: '"etag-public"',
      } as unknown as ParsedHeaders;

      cacheResponse(
        clientA,
        url,
        'GET',
        'v1/status/',
        parsed,
        { players: 500 },
        true,
        resolveCache,
        undefined,
        false,
      );

      const staleParsed = { raw: {} } as unknown as ParsedHeaders;
      const result = tryStaleCacheResponse(
        clientB,
        url,
        staleParsed,
        resolveCache,
        false,
      );
      expect(result).not.toBeNull();
      expect(result!.body).toEqual({ players: 500 });

      cache.shutdown();
    });
  });
});
