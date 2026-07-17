import { AllianceClient } from '../../../src/clients/AllianceClient';
import { StatusClient } from '../../../src/clients/StatusClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const standardHeaders = (overrides: Record<string, string> = {}) => ({
  'x-pages': '1',
  'content-type': 'application/json',
  ...overrides,
});

describe('withMetadata()', () => {
  let apiClient: ApiClient;
  let allianceClient: AllianceClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('https://esi.evetech.net', 'test-client');
    apiClient.setRateLimiter(rateLimiter);
    allianceClient = new AllianceClient(apiClient);
  });

  it('returns the same withMetadata instance on repeated calls', () => {
    const meta1 = allianceClient.withMetadata();
    const meta2 = allianceClient.withMetadata();
    expect(meta1).toBe(meta2);
  });

  it('wraps response body with data and meta fields', async () => {
    const mockAlliance = {
      alliance_id: 99000001,
      name: 'Test Alliance',
      ticker: 'TEST',
      creator_id: 123,
      creator_corporation_id: 456,
      date_founded: '2020-01-01T00:00:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockAlliance), {
      headers: standardHeaders({
        'x-ratelimit-remaining': '95',
        'x-ratelimit-limit': '100',
      }),
    });

    const metaClient = allianceClient.withMetadata();
    const result = await metaClient.getAllianceById(99000001);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(result.data).toEqual(mockAlliance);
    expect(result.meta).toHaveProperty('headers');
    expect(result.meta).toHaveProperty('fromCache');
    expect(result.meta).toHaveProperty('stale');
    expect(result.meta.fromCache).toBe(false);
    expect(result.meta.stale).toBe(false);
    expect(typeof result.meta.headers).toBe('object');
  });

  it('normal client still returns unwrapped data', async () => {
    const mockAlliances = [99000001, 99000002];

    fetchMock.mockResponseOnce(JSON.stringify(mockAlliances), {
      headers: standardHeaders(),
    });

    const result = await allianceClient.getAlliances();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(mockAlliances);
    expect(result).not.toHaveProperty('meta');
  });

  describe('rate limit metadata', () => {
    it('populates meta.rateLimit from response headers', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([99000001]), {
        headers: standardHeaders({
          'x-ratelimit-remaining': '90',
          'x-ratelimit-limit': '100',
          'x-ratelimit-used': '10',
          'x-ratelimit-group': 'market',
        }),
      });

      const metaClient = allianceClient.withMetadata();
      const result = await metaClient.getAlliances();

      expect(result.meta.rateLimit).toBeDefined();
      expect(result.meta.rateLimit!.remaining).toBe(90);
      expect(result.meta.rateLimit!.limit).toBe(100);
      expect(result.meta.rateLimit!.used).toBe(10);
      expect(result.meta.rateLimit!.group).toBe('market');
    });

    it('meta.rateLimit is undefined when no rate limit headers', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([99000001]), {
        headers: standardHeaders(),
      });

      const metaClient = allianceClient.withMetadata();
      const result = await metaClient.getAlliances();

      expect(result.meta.rateLimit).toBeUndefined();
    });
  });

  describe('response timing', () => {
    it('meta.responseTimeMs is a non-negative number', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([99000001]), {
        headers: standardHeaders(),
      });

      const metaClient = allianceClient.withMetadata();
      const result = await metaClient.getAlliances();

      expect(result.meta.responseTimeMs).toBeDefined();
      expect(typeof result.meta.responseTimeMs).toBe('number');
      expect(result.meta.responseTimeMs!).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cache hit type', () => {
    it('cacheHitType is undefined for normal 200 response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([99000001]), {
        headers: standardHeaders(),
      });

      const metaClient = allianceClient.withMetadata();
      const result = await metaClient.getAlliances();

      expect(result.meta.cacheHitType).toBeUndefined();
    });

    it('cacheHitType is etag-304 for ETag cache hit', async () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
        cleanupInterval: 60000,
      });
      apiClient.setCache(cache);

      const { handleRequest } =
        await import('../../../src/core/ApiRequestHandler');

      fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
        headers: standardHeaders({ etag: '"test-etag"' }),
      });

      await handleRequest(apiClient, 'v1/test-endpoint/', 'GET');

      fetchMock.mockResponseOnce(
        new Response(null, {
          status: 304,
          headers: standardHeaders({ etag: '"test-etag"' }),
        }),
      );

      const response = await handleRequest(
        apiClient,
        'v1/test-endpoint/',
        'GET',
      );

      expect(response.cacheHitType).toBe('etag-304');
      expect(response.fromCache).toBe(true);
    });

    it('cacheHitType is spec-ttl for spec-aware cache hit', async () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
        cleanupInterval: 60000,
      });
      apiClient.setCache(cache);
      const statusClient = new StatusClient(apiClient);

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 100,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders({ etag: '"test-etag"' }) },
      );

      await statusClient.getStatus();

      const metaClient = statusClient.withMetadata();
      const result = await metaClient.getStatus();

      expect(result.meta.cacheHitType).toBe('spec-ttl');
      expect(result.meta.fromCache).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
