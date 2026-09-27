import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { EsiError } from '../../../src/core/util/error';
import { retryDelay } from '../../../src/core/util/retry';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  CircuitBreaker,
  CircuitOpenError,
} from '../../../src/core/circuitBreaker/CircuitBreaker';
import * as sleepModule from '../../../src/core/util/sleep';
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

/**
 * The back-off waits go through sleep(). Waiting them out for real made each
 * test take as long as its delays and let a mutant that stretched a delay be
 * "killed" by a timeout on a slow runner and survive on a fast one. Here
 * sleep() is recorded and resolved at once, Math.random is pinned so the
 * jitter factor is exactly 1 (0.75 + 0.5 * 0.5), and every test asserts the
 * delays it asked for. One test keeps the real sleep on Jest's fake clock to
 * show the retry is sent at the scheduled delay and not before.
 */
describe('Retry with exponential backoff', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;
  let sleepSpy: jest.SpyInstance;
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
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
    sleepSpy.mockRestore();
    randomSpy.mockRestore();
    jest.useRealTimers();
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
    expect(sleepSpy.mock.calls).toEqual([[10]]);
  });

  it('sends the retry at exactly the back-off delay, not before', async () => {
    sleepSpy.mockRestore();
    jest.useFakeTimers({ now: 1_000_000 });
    client.setRetryConfig({ maxRetries: 3, baseDelayMs: 40, maxDelayMs: 100 });

    fetchMock.mockResponseOnce('', {
      status: 502,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
      headers: standardHeaders(),
    });

    const pending = handleRequest(client, 'v1/status/', 'GET');

    await jest.advanceTimersByTimeAsync(39);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    const result = await pending;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.body).toEqual({ players: 100 });
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
    expect(sleepSpy.mock.calls).toEqual([[10]]);
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
    expect(sleepSpy.mock.calls).toEqual([[10]]);
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
    // Three back-offs, doubling from baseDelayMs; none after the last attempt.
    expect(sleepSpy.mock.calls).toEqual([[10], [20], [40]]);
  });

  it('caps each back-off at maxDelayMs', async () => {
    client.setRetryConfig({ maxRetries: 3, baseDelayMs: 10, maxDelayMs: 25 });
    for (let i = 0; i < 4; i++) {
      fetchMock.mockResponseOnce('', {
        status: 502,
        headers: standardHeaders(),
      });
    }

    await expect(handleRequest(client, 'v1/status/', 'GET')).rejects.toThrow(
      EsiError,
    );
    expect(sleepSpy.mock.calls).toEqual([[10], [20], [25]]);
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
    expect(sleepSpy).not.toHaveBeenCalled();
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
    expect(sleepSpy.mock.calls).toEqual([[10]]);
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
