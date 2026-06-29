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
});
