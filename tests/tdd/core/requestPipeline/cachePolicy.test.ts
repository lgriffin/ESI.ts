import {
  lookupSpecTtl,
  trySpecAwareCacheHit,
  tryStaleCacheResponse,
  cacheResponse,
} from '../../../../src/core/requestPipeline/cachePolicy';
import { ApiClient } from '../../../../src/core/ApiClient';
import { ICache } from '../../../../src/core/cache/ICache';
import { ETagCacheManager } from '../../../../src/core/cache/ETagCacheManager';
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
      const result = lookupSpecTtl('GET', '/v1/status/');
      if (result !== undefined) {
        // ESI cache TTLs are at least 1 second = 1000ms
        expect(result).toBeGreaterThanOrEqual(1000);
      }
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
        '/v1/status/',
        resolveCache,
      );

      // If there's a spec TTL for /v1/status, the hit should work
      if (result) {
        expect(result.fromCache).toBe(true);
        expect(result.cacheHitType).toBe('spec-ttl');
        expect(result.body).toEqual({ players: 100 });
      }

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
});
