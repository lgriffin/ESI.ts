import { ApiClient } from '../../../src/core/ApiClient';
import { createClient } from '../../../src/core/endpoints/createClient';
import { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError } from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

const endpoints = {
  getStatus: {
    path: 'latest/status/',
    method: 'GET' as const,
    requiresAuth: false,
  },
} satisfies EndpointMap;

describe('createClient safeMode', () => {
  let apiClient: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('test', BASE_URL);
    apiClient.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  it('should return { ok: true, data, meta } on success', async () => {
    const mockData = {
      players: 23456,
      server_version: '2345678',
      start_time: '2024-01-01T00:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(mockData), {
      headers: {
        'x-pages': '1',
        'x-ratelimit-remaining': '95',
        'x-ratelimit-limit': '100',
        'x-ratelimit-used': '5',
        'x-ratelimit-group': 'market',
      },
    });

    const client = createClient(apiClient, endpoints, { safeMode: true });
    const result = (await client.getStatus()) as {
      ok: boolean;
      data: unknown;
      meta: unknown;
    };

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.meta).toBeDefined();
  });

  it('should return { ok: false, error } on failure without throwing', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const client = createClient(apiClient, endpoints, { safeMode: true });
    const result = (await client.getStatus()) as {
      ok: boolean;
      error: EsiError;
    };

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(EsiError);
  });

  it('should still throw in default mode', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const client = createClient(apiClient, endpoints);
    await expect(client.getStatus()).rejects.toThrow();
  });

  it('should wrap non-EsiError errors', async () => {
    fetchMock.mockReject(new TypeError('Network failure'));

    const client = createClient(apiClient, endpoints, { safeMode: true });
    const result = (await client.getStatus()) as {
      ok: boolean;
      error: EsiError;
    };

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(EsiError);
    expect(result.error.message).toContain('Network failure');
  });
});
