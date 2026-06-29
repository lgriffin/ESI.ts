import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { EsiError } from '../../../src/core/util/error';
import { retryDelay } from '../../../src/core/util/retry';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  CircuitBreaker,
  CircuitOpenError,
} from '../../../src/core/circuitBreaker/CircuitBreaker';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

const standardHeaders = (overrides: Record<string, string> = {}) => ({
  'x-pages': '1',
  'x-ratelimit-remaining': '95',
  'x-ratelimit-limit': '100',
  'x-ratelimit-used': '5',
  'content-type': 'application/json',
  ...overrides,
});

describe('retryDelay utility', () => {
  it('returns a value between 0.75x and 1.25x of exponential base', () => {
    for (let i = 0; i < 20; i++) {
      const delay = retryDelay(0, 1000, 30000);
      expect(delay).toBeGreaterThanOrEqual(750);
      expect(delay).toBeLessThanOrEqual(1250);
    }
  });

  it('increases with attempt number', () => {
    const delays: number[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      const samples = Array.from({ length: 50 }, () =>
        retryDelay(attempt, 1000, 100000),
      );
      delays.push(samples.reduce((a, b) => a + b) / samples.length);
    }
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]!).toBeGreaterThan(delays[i - 1]!);
    }
  });

  it('caps at maxMs', () => {
    const delay = retryDelay(20, 1000, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });
});

describe('Retry with exponential backoff', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
    client.setRetryConfig({
      maxRetries: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
    });
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  it('retries on 502 and succeeds', async () => {
    fetchMock.mockResponseOnce('', {
      status: 502,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
      headers: standardHeaders(),
    });

    const result = await handleRequest(client, 'v1/status/', 'GET');
    expect(result.body).toEqual({ players: 100 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 and succeeds', async () => {
    fetchMock.mockResponseOnce('', {
      status: 503,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
      headers: standardHeaders(),
    });

    const result = await handleRequest(client, 'v1/status/', 'GET');
    expect(result.body).toEqual({ players: 100 });
  });

  it('retries on 504 and succeeds', async () => {
    fetchMock.mockResponseOnce('', {
      status: 504,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
      headers: standardHeaders(),
    });

    const result = await handleRequest(client, 'v1/status/', 'GET');
    expect(result.body).toEqual({ players: 100 });
  });

  it('exhausts retries and throws', async () => {
    for (let i = 0; i < 4; i++) {
      fetchMock.mockResponseOnce('', {
        status: 502,
        headers: standardHeaders(),
      });
    }

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EsiError);
      expect((e as EsiError).statusCode).toBe(502);
    }
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does NOT retry 400', async () => {
    fetchMock.mockResponseOnce('', {
      status: 400,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EsiError);
      expect((e as EsiError).statusCode).toBe(400);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry 403', async () => {
    fetchMock.mockResponseOnce('', {
      status: 403,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect((e as EsiError).statusCode).toBe(403);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry 404', async () => {
    fetchMock.mockResponseOnce('', {
      status: 404,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect((e as EsiError).statusCode).toBe(404);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry POST by default', async () => {
    fetchMock.mockResponseOnce('', {
      status: 502,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/universe/names/', 'POST', [1, 2]);
      fail('Should have thrown');
    } catch (e) {
      expect((e as EsiError).statusCode).toBe(502);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries POST when retryMutations is true', async () => {
    client.setRetryConfig({
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 100,
      retryMutations: true,
    });

    fetchMock.mockResponseOnce('', {
      status: 502,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 1, name: 'Test' }]), {
      headers: standardHeaders(),
    });

    const result = await handleRequest(
      client,
      'v1/universe/names/',
      'POST',
      [1],
    );
    expect(result.body).toEqual([{ id: 1, name: 'Test' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry when circuit breaker is open', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 60000,
      halfOpenMaxAttempts: 1,
    });
    client.setCircuitBreaker(cb);

    fetchMock.mockResponseOnce('', {
      status: 500,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/status/', 'GET');
    } catch {
      // Trip the circuit
    }

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown CircuitOpenError');
    } catch (e) {
      expect(e).toBeInstanceOf(CircuitOpenError);
    }
  });

  it('does not retry when retryConfig is not set', async () => {
    client.setRetryConfig(null);

    fetchMock.mockResponseOnce('', {
      status: 502,
      headers: standardHeaders(),
    });

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect((e as EsiError).statusCode).toBe(502);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retryAttempts backward compat maps to retryConfig', () => {
    const testClient = new ApiClient('compat', BASE_URL);
    testClient.setRetryConfig({ maxRetries: 5 });
    expect(testClient.getRetryConfig()?.maxRetries).toBe(5);
  });
});
