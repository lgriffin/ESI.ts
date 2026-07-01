import { EsiClient } from '../../../src/EsiClient';
import { EsiError, TimeoutError } from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';
import * as sleepModule from '../../../src/core/util/sleep';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.test.local';

const standardHeaders = (overrides: Record<string, string> = {}) => ({
  'x-pages': '1',
  'x-ratelimit-remaining': '95',
  'x-ratelimit-limit': '100',
  'x-ratelimit-used': '5',
  'x-ratelimit-group': 'market',
  ...overrides,
});

function resetGlobals() {
  fetchMock.resetMocks();
}

describe('Resilience: Error Handling and Recovery', () => {
  let client: EsiClient;

  afterEach(() => {
    client?.shutdown();
  });

  describe('429 Rate Limit Response', () => {
    beforeEach(() => {
      resetGlobals();
      client = new EsiClient({
        clientId: 'resilience-429',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    it('should throw EsiError with statusCode 429', async () => {
      fetchMock.mockResponseOnce('', {
        status: 429,
        headers: standardHeaders({ 'retry-after': '10' }),
      });

      try {
        await client.status.getStatus();
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EsiError);
        const err = e as EsiError;
        expect(err.statusCode).toBe(429);
        expect(err.retryable).toBe(true);
        expect(err.isRateLimited()).toBe(true);
      }
    });

    it('should automatically retry on 429 when retryConfig is set', async () => {
      const sleepSpy = jest
        .spyOn(sleepModule, 'sleep')
        .mockResolvedValue(undefined);

      const retryClient = new EsiClient({
        clientId: 'resilience-429-retry',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
        retryConfig: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 },
      });

      fetchMock.mockResponseOnce('', {
        status: 429,
        headers: standardHeaders({ 'retry-after': '1' }),
      });
      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 100,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );

      const result = await retryClient.status.getStatus();
      expect(result.players).toBe(100);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      retryClient.shutdown();
      sleepSpy.mockRestore();
    });
  });

  describe('Malformed JSON Response', () => {
    beforeEach(() => {
      resetGlobals();
      client = new EsiClient({
        clientId: 'resilience-json',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    it('should throw EsiError on invalid JSON body', async () => {
      fetchMock.mockResponseOnce('{invalid json', {
        status: 200,
        headers: standardHeaders(),
      });

      await expect(client.status.getStatus()).rejects.toThrow(/Invalid JSON/);
    });
  });

  describe('Truncated Response', () => {
    beforeEach(() => {
      resetGlobals();
      client = new EsiClient({
        clientId: 'resilience-truncated',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    it('should throw EsiError on truncated JSON body', async () => {
      fetchMock.mockResponseOnce('{"players": 123', {
        status: 200,
        headers: standardHeaders(),
      });

      await expect(client.status.getStatus()).rejects.toThrow(/Invalid JSON/);
    });
  });

  describe('Empty Response Body', () => {
    beforeEach(() => {
      resetGlobals();
      client = new EsiClient({
        clientId: 'resilience-empty',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    it('should handle empty string body gracefully', async () => {
      fetchMock.mockResponseOnce('', {
        status: 200,
        headers: standardHeaders(),
      });

      // Empty body will fail JSON parsing — should throw a parse error
      await expect(client.status.getStatus()).rejects.toThrow();
    });
  });

  describe('ESI Error Body Parsing', () => {
    beforeEach(() => {
      resetGlobals();
      client = new EsiClient({
        clientId: 'resilience-403',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    it('should throw EsiError with correct statusCode and message on 403', async () => {
      fetchMock.mockResponseOnce('', {
        status: 403,
        headers: standardHeaders(),
      });

      try {
        await client.status.getStatus();
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EsiError);
        const err = e as EsiError;
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('Forbidden');
        expect(err.isForbidden()).toBe(true);
      }
    });
  });

  describe('420 Error Limited', () => {
    beforeEach(() => {
      resetGlobals();
    });

    it('should throw EsiError with statusCode 420', async () => {
      client = new EsiClient({
        clientId: 'resilience-420',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });

      fetchMock.mockResponseOnce('', {
        status: 420,
        headers: standardHeaders(),
      });

      try {
        await client.status.getStatus();
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EsiError);
        const err = e as EsiError;
        expect(err.statusCode).toBe(420);
        expect(err.isRateLimited()).toBe(true);
        expect(err.retryable).toBe(true);
      }
    });

    it('should record circuit breaker failure on 420 when enabled', async () => {
      client = new EsiClient({
        clientId: 'resilience-420-cb',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
        enableCircuitBreaker: true,
        circuitBreakerConfig: {
          failureThreshold: 5,
          resetTimeoutMs: 1000,
          halfOpenMaxAttempts: 1,
        },
      });

      fetchMock.mockResponseOnce('', {
        status: 420,
        headers: standardHeaders(),
      });

      await expect(client.status.getStatus()).rejects.toThrow(EsiError);

      const cbStats = client.getCircuitBreakerStats();
      expect(cbStats).not.toBeNull();
      // At least one circuit should have recorded a failure
      const circuits = Object.values(cbStats!.circuits);
      const totalFailures = circuits.reduce((sum, c) => sum + c.failures, 0);
      expect(totalFailures).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Network Timeout', () => {
    beforeEach(() => {
      resetGlobals();
    });

    it('should throw on timeout when request exceeds timeout duration', async () => {
      client = new EsiClient({
        clientId: 'resilience-timeout',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
        timeout: 50,
      });

      fetchMock.mockResponseOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  body: JSON.stringify({ players: 1 }),
                  headers: standardHeaders(),
                }),
              200,
            ),
          ),
      );

      await expect(client.status.getStatus()).rejects.toThrow();
    });
  });

  describe('Retry with Backoff', () => {
    beforeEach(() => {
      resetGlobals();
    });

    it('should succeed after retrying through transient 503 errors', async () => {
      const sleepSpy = jest
        .spyOn(sleepModule, 'sleep')
        .mockResolvedValue(undefined);

      client = new EsiClient({
        clientId: 'resilience-retry-backoff',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: false,
        retryConfig: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      });

      // First two calls return 503 (retryable)
      fetchMock.mockResponseOnce('', {
        status: 503,
        headers: standardHeaders(),
      });
      fetchMock.mockResponseOnce('', {
        status: 503,
        headers: standardHeaders(),
      });
      // Third call succeeds
      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 42,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );

      const result = await client.status.getStatus();
      expect(result.players).toBe(42);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      // sleep should have been called for each retry wait
      expect(sleepSpy).toHaveBeenCalled();

      sleepSpy.mockRestore();
    });
  });

  describe('Stale Cache on 5xx', () => {
    beforeEach(() => {
      resetGlobals();
    });

    it('should serve stale cached response on 5xx when cache is available', async () => {
      client = new EsiClient({
        clientId: 'resilience-stale-cache',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
        enableRequestDeduplication: false,
      });

      const data = {
        players: 999,
        server_version: '1',
        start_time: '2024-01-01T00:00:00Z',
      };

      // First request populates the cache
      fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: standardHeaders({ etag: '"stale-test-1"' }),
      });
      const first = await client.status.getStatus();
      expect(first).toEqual(data);

      // Second request returns 500 — should serve stale cache
      fetchMock.mockResponseOnce('', {
        status: 500,
        headers: standardHeaders(),
      });
      const second = await client.status.getStatus();
      expect(second).toEqual(data);
    });
  });

  describe('Request Deduplication', () => {
    beforeEach(() => {
      resetGlobals();
    });

    it('should only make one fetch call for two simultaneous identical GET requests', async () => {
      client = new EsiClient({
        clientId: 'resilience-dedup',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableRequestDeduplication: true,
      });

      const data = {
        players: 500,
        server_version: '1',
        start_time: '2024-01-01T00:00:00Z',
      };
      fetchMock.mockResponse(JSON.stringify(data), {
        headers: standardHeaders(),
      });

      // Fire two identical requests simultaneously
      const [result1, result2] = await Promise.all([
        client.status.getStatus(),
        client.status.getStatus(),
      ]);

      expect(result1).toEqual(data);
      expect(result2).toEqual(data);
      // Only one actual fetch should have been made
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
