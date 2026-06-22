import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { EsiError } from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('ApiRequestHandler', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('authentication', () => {
    it('should throw NO_AUTH_TOKEN when requiresAuth is true and no token', async () => {
      await expect(
        handleRequest(client, 'v1/characters/123/', 'GET', undefined, true),
      ).rejects.toThrow('Authorization header is required');
    });

    it('should include Authorization header when token is set', async () => {
      client.setAccessToken('test-token');
      fetchMock.mockResponseOnce(JSON.stringify({ name: 'Test' }));

      await handleRequest(client, 'v1/characters/123/', 'GET', undefined, true);

      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('Content-Type header', () => {
    it('should set Content-Type for POST with body', async () => {
      client.setAccessToken('test-token');
      fetchMock.mockResponseOnce(JSON.stringify({}), { status: 201 });

      await handleRequest(
        client,
        'v1/characters/123/contacts/',
        'POST',
        [{ contact_id: 1 }],
        true,
      );

      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not set Content-Type for GET without body', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));

      await handleRequest(client, 'v1/status/', 'GET');

      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Content-Type']).toBeUndefined();
    });
  });

  describe('201 Created responses', () => {
    it('should parse JSON body on 201', async () => {
      client.setAccessToken('test-token');
      fetchMock.mockResponseOnce(JSON.stringify({ id: 42 }), { status: 201 });

      const result = await handleRequest(
        client,
        'v1/characters/123/fittings/',
        'POST',
        { name: 'Test' },
        true,
      );

      expect(result.body).toEqual({ id: 42 });
    });

    it('should return undefined body on 201 with no JSON', async () => {
      client.setAccessToken('test-token');
      fetchMock.mockResponseOnce('not json', { status: 201 });

      const result = await handleRequest(
        client,
        'v1/characters/123/fittings/',
        'POST',
        { name: 'Test' },
        true,
      );

      expect(result.body).toBeUndefined();
    });
  });

  describe('JSON parse errors', () => {
    it('should throw JSON_PARSE_ERROR for invalid JSON', async () => {
      fetchMock.mockResponseOnce('not valid json {{{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

      await expect(
        handleRequest(client, 'v1/status/', 'GET'),
      ).rejects.toThrow();
    });
  });

  describe('5xx with stale cache', () => {
    it('should serve stale cache on 500 when cached data exists', async () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      cache.set(
        `${BASE_URL}/v1/status/`,
        '"etag-123"',
        { players: 100 },
        { 'content-type': 'application/json' },
      );

      fetchMock.mockResponseOnce('Internal Server Error', { status: 500 });

      const result = await handleRequest(client, 'v1/status/', 'GET');

      expect(result.body).toEqual({ players: 100 });
      expect(result.fromCache).toBe(true);
      expect(result.stale).toBe(true);

      cache.shutdown();
    });

    it('should throw on 500 when no cached data exists', async () => {
      fetchMock.mockResponseOnce('Internal Server Error', { status: 500 });

      await expect(handleRequest(client, 'v1/status/', 'GET')).rejects.toThrow(
        EsiError,
      );
    });
  });

  describe('error handling', () => {
    it('should throw EsiError for 404 responses', async () => {
      fetchMock.mockResponseOnce('Not found', { status: 404 });

      await expect(
        handleRequest(client, 'v1/characters/999999/', 'GET'),
      ).rejects.toThrow(EsiError);
    });

    it('should throw EsiError for 403 responses', async () => {
      fetchMock.mockResponseOnce('Forbidden', { status: 403 });

      await expect(
        handleRequest(client, 'v1/characters/123/', 'GET'),
      ).rejects.toThrow(EsiError);
    });
  });
});
