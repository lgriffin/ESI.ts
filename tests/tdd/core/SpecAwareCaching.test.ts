import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('Spec-Aware Caching', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;
  let cache: ETagCacheManager;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    cache = new ETagCacheManager({
      maxEntries: 100,
      defaultTtl: 60000,
      cleanupInterval: 60000,
    });
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
    client.setCache(cache);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('cache bypass for known endpoints', () => {
    it('should return cached data without HTTP call when within spec TTL', async () => {
      const mockData = [{ alliance_id: 1 }];
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"abc"',
          'Content-Type': 'application/json',
        },
      });

      // First request — populates cache
      const first = await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );
      expect(first.body).toEqual(mockData);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second request within spec TTL (alliances/ has 3600s TTL)
      const second = await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );
      expect(second.body).toEqual(mockData);
      expect(second.fromCache).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should make HTTP call when no templatePath is provided', async () => {
      const mockData = [{ alliance_id: 1 }];
      fetchMock.mockResponse(JSON.stringify(mockData), {
        headers: {
          ETag: '"abc"',
          'Content-Type': 'application/json',
        },
      });

      await handleRequest(client, 'v1/alliances/', 'GET');
      await handleRequest(client, 'v1/alliances/', 'GET');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should not apply spec cache bypass for POST requests', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });

      await handleRequest(
        client,
        'v1/universe/names/',
        'POST',
        [1, 2, 3],
        false,
        true,
        'universe/names/',
      );
      await handleRequest(
        client,
        'v1/universe/names/',
        'POST',
        [1, 2, 3],
        false,
        true,
        'universe/names/',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should make HTTP call when endpoint has no spec TTL', async () => {
      const mockData = { name: 'Test' };
      fetchMock.mockResponse(JSON.stringify(mockData), {
        headers: {
          ETag: '"xyz"',
          'Content-Type': 'application/json',
        },
      });

      // Use a fake path that won't be in the TTL map
      await handleRequest(
        client,
        'v1/fake/endpoint/',
        'GET',
        undefined,
        false,
        true,
        'fake/endpoint/',
      );
      await handleRequest(
        client,
        'v1/fake/endpoint/',
        'GET',
        undefined,
        false,
        true,
        'fake/endpoint/',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('path normalization', () => {
    it('should normalize camelCase path params to snake_case for TTL lookup', async () => {
      const mockData = { name: 'Test Character' };
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"char1"',
          'Content-Type': 'application/json',
        },
      });

      // characters/{character_id} has a spec TTL of 604800s
      // Template uses camelCase: characters/{characterId}
      await handleRequest(
        client,
        'v1/characters/123/',
        'GET',
        undefined,
        false,
        true,
        'characters/{characterId}/',
      );
      const second = await handleRequest(
        client,
        'v1/characters/123/',
        'GET',
        undefined,
        false,
        true,
        'characters/{characterId}/',
      );

      expect(second.fromCache).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache miss scenarios', () => {
    it('should make HTTP call when cache is empty even with valid templatePath', async () => {
      const mockData = [{ alliance_id: 1 }];
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"first"',
          'Content-Type': 'application/json',
        },
      });

      const result = await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );

      expect(result.body).toEqual(mockData);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not apply spec cache when no cache is configured', async () => {
      const clientNoCache = new ApiClient('test-no-cache', BASE_URL);
      clientNoCache.setRateLimiter(rateLimiter);

      const mockData = [{ alliance_id: 1 }];
      fetchMock.mockResponse(JSON.stringify(mockData), {
        headers: { 'Content-Type': 'application/json' },
      });

      await handleRequest(
        clientNoCache,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        false,
        'alliances/',
      );
      await handleRequest(
        clientNoCache,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        false,
        'alliances/',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('TTL / ETag reconciliation', () => {
    it('should preserve ETag after default TTL expires when spec TTL is longer', async () => {
      // Use a short defaultTtl (100ms) to simulate the bug scenario:
      // spec TTL (3600s for alliances/) >> defaultTtl (100ms)
      const shortTtlCache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 100, // 100ms — very short
        cleanupInterval: 600000, // disable automatic cleanup
      });
      client.setCache(shortTtlCache);

      const mockData = [{ alliance_id: 1 }];
      // First request — populates cache with ETag
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-1"',
          'Content-Type': 'application/json',
        },
      });

      await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Wait for the default TTL to expire (100ms) but stay within spec TTL (3600s)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second request — spec-aware cache hit should still work because the
      // entry TTL was set to spec TTL (3600s), not defaultTtl (100ms).
      // Before the fix, the entry would have been evicted at 100ms, losing the ETag.
      const second = await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );
      expect(second.fromCache).toBe(true);
      expect(second.cacheHitType).toBe('spec-ttl');
      // No additional fetch should have been made
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should use spec TTL even when Cache-Control header provides a shorter TTL', async () => {
      const mockData = [{ alliance_id: 1 }];
      // Respond with a short Cache-Control max-age (1s) but the spec TTL for
      // alliances/ is 3600s — the entry should be cached with the spec TTL.
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-2"',
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=1',
        },
      });

      await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );

      // Wait beyond the Cache-Control max-age (1s) but within spec TTL (3600s)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Spec-aware cache hit should still work — entry TTL = spec TTL
      const second = await handleRequest(
        client,
        'v1/alliances/',
        'GET',
        undefined,
        false,
        true,
        'alliances/',
      );
      expect(second.fromCache).toBe(true);
      expect(second.cacheHitType).toBe('spec-ttl');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should fall back to header TTL when no spec TTL exists', async () => {
      // Use a short-lived cache with a very short defaultTtl
      const shortTtlCache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 100, // 100ms
        cleanupInterval: 600000,
      });
      client.setCache(shortTtlCache);

      const mockData = { name: 'Unknown Endpoint' };
      // Endpoint with no spec TTL, and a Cache-Control header of 2s
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-3"',
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=2',
        },
      });

      await handleRequest(
        client,
        'v1/fake/unknown/',
        'GET',
        undefined,
        false,
        true,
        'fake/unknown/',
      );

      // Wait beyond the defaultTtl (100ms) but within Cache-Control (2s)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // With no spec TTL, the entry TTL should be from Cache-Control (2000ms),
      // so it should still be present and the ETag should be retrievable.
      // The second request should include If-None-Match (ETag preserved).
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-3"',
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=2',
        },
      });

      await handleRequest(
        client,
        'v1/fake/unknown/',
        'GET',
        undefined,
        false,
        true,
        'fake/unknown/',
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Verify If-None-Match was sent (ETag was preserved, not evicted)
      const secondCallHeaders = fetchMock.mock.calls[1]![1]!.headers as Record<
        string,
        string
      >;
      expect(secondCallHeaders['If-None-Match']).toBe('"etag-reconcile-3"');
    });

    it('should fall back to defaultTtl when no spec TTL and no Cache-Control exist', async () => {
      // Use a short-lived cache
      const shortTtlCache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 100, // 100ms
        cleanupInterval: 600000,
      });
      client.setCache(shortTtlCache);

      const mockData = { name: 'No Headers' };
      // Endpoint with no spec TTL and no Cache-Control header
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-4"',
          'Content-Type': 'application/json',
        },
      });

      await handleRequest(
        client,
        'v1/fake/noheaders/',
        'GET',
        undefined,
        false,
        true,
        'fake/noheaders/',
      );

      // Wait beyond the defaultTtl (100ms)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // With no spec TTL and no Cache-Control, the entry uses defaultTtl (100ms).
      // After 150ms it should be expired and evicted — ETag lost, full GET.
      fetchMock.mockResponseOnce(JSON.stringify(mockData), {
        headers: {
          ETag: '"etag-reconcile-4b"',
          'Content-Type': 'application/json',
        },
      });

      const second = await handleRequest(
        client,
        'v1/fake/noheaders/',
        'GET',
        undefined,
        false,
        true,
        'fake/noheaders/',
      );
      // Should NOT be from cache — entry expired at defaultTtl
      expect(second.fromCache).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Verify If-None-Match was NOT sent (ETag was lost)
      const secondCallHeaders = fetchMock.mock.calls[1]![1]!.headers as Record<
        string,
        string
      >;
      expect(secondCallHeaders['If-None-Match']).toBeUndefined();
    });
  });
});
