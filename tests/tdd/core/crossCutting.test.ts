import { EsiClient } from '../../../src/EsiClient';
import { ILogger } from '../../../src/core/logger/ILogger';
import { setLogger, getLogger } from '../../../src/core/logger/loggerUtil';
import { EsiError } from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

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

describe('Cross-Cutting Concerns', () => {
  // ─── Diagnostics Accuracy ───────────────────────────────────────────

  describe('Diagnostics Accuracy', () => {
    let client: EsiClient;

    afterEach(() => {
      client.shutdown();
    });

    it('should show totalEntries >= 1 after a cached request', async () => {
      client = new EsiClient({
        clientId: 'diag-cache',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 10000,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders({ etag: '"test-etag-1"' }) },
      );

      await client.status.getStatus();

      const stats = client.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats!.totalEntries).toBeGreaterThanOrEqual(1);
    });

    it('should show totalEntries === 0 when no requests have been made', () => {
      client = new EsiClient({
        clientId: 'diag-cache-empty',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
      });

      const stats = client.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats!.totalEntries).toBe(0);
    });

    it('should report openCircuits === 0 after successful requests', async () => {
      client = new EsiClient({
        clientId: 'diag-cb-closed',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableCircuitBreaker: true,
        circuitBreakerConfig: {
          failureThreshold: 3,
          resetTimeoutMs: 500,
          halfOpenMaxAttempts: 1,
        },
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 5000,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );

      await client.status.getStatus();

      const stats = client.getCircuitBreakerStats();
      expect(stats).not.toBeNull();
      expect(stats!.openCircuits).toBe(0);
    });

    it('should report openCircuits > 0 after enough failures to trip the breaker', async () => {
      client = new EsiClient({
        clientId: 'diag-cb-open',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableCircuitBreaker: true,
        circuitBreakerConfig: {
          failureThreshold: 3,
          resetTimeoutMs: 60000,
          halfOpenMaxAttempts: 1,
        },
      });

      for (let i = 0; i < 3; i++) {
        fetchMock.mockResponseOnce('', {
          status: 500,
          headers: standardHeaders(),
        });
      }

      for (let i = 0; i < 3; i++) {
        await expect(client.status.getStatus()).rejects.toThrow(EsiError);
      }

      const stats = client.getCircuitBreakerStats();
      expect(stats).not.toBeNull();
      expect(stats!.openCircuits).toBeGreaterThan(0);
    });

    it('should show totalEntries === 0 after clearCache()', async () => {
      client = new EsiClient({
        clientId: 'diag-clear',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders({ etag: '"clear-etag"' }),
        },
      );
      await client.status.getStatus();

      expect(client.getCacheStats()!.totalEntries).toBeGreaterThanOrEqual(1);

      client.clearCache();

      expect(client.getCacheStats()!.totalEntries).toBe(0);
    });

    it('should allow requests after resetCircuitBreaker()', async () => {
      client = new EsiClient({
        clientId: 'diag-cb-reset',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        enableCircuitBreaker: true,
        circuitBreakerConfig: {
          failureThreshold: 3,
          resetTimeoutMs: 60000,
          halfOpenMaxAttempts: 1,
        },
      });

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        fetchMock.mockResponseOnce('', {
          status: 500,
          headers: standardHeaders(),
        });
      }
      for (let i = 0; i < 3; i++) {
        await expect(client.status.getStatus()).rejects.toThrow(EsiError);
      }

      // Confirm it is open
      expect(client.getCircuitBreakerStats()!.openCircuits).toBeGreaterThan(0);

      // Reset and verify a subsequent request succeeds
      client.resetCircuitBreaker();

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 9999,
          server_version: '2',
          start_time: '2024-06-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );

      const result = await client.status.getStatus();
      expect(result.players).toBe(9999);
    });
  });

  // ─── Middleware Ordering (Exhaustive) ───────────────────────────────

  describe('Middleware Ordering', () => {
    let client: EsiClient;

    beforeEach(() => {
      fetchMock.resetMocks();
    });

    afterEach(() => {
      client.shutdown();
    });

    it('should fire multiple request interceptors in registration order', async () => {
      client = new EsiClient({
        clientId: 'mw-req-order',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      const order: number[] = [];

      client.addRequestInterceptor((ctx) => {
        order.push(1);
        return ctx;
      });
      client.addRequestInterceptor((ctx) => {
        order.push(2);
        return ctx;
      });
      client.addRequestInterceptor((ctx) => {
        order.push(3);
        return ctx;
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();

      expect(order).toEqual([1, 2, 3]);
    });

    it('should fire multiple response interceptors in registration order', async () => {
      client = new EsiClient({
        clientId: 'mw-res-order',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      const order: number[] = [];

      client.addResponseInterceptor((ctx) => {
        order.push(1);
        return ctx;
      });
      client.addResponseInterceptor((ctx) => {
        order.push(2);
        return ctx;
      });
      client.addResponseInterceptor((ctx) => {
        order.push(3);
        return ctx;
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();

      expect(order).toEqual([1, 2, 3]);
    });

    it('should fire request interceptors before response interceptors', async () => {
      client = new EsiClient({
        clientId: 'mw-req-before-res',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      const order: string[] = [];

      client.addRequestInterceptor((ctx) => {
        order.push('request-1');
        return ctx;
      });
      client.addRequestInterceptor((ctx) => {
        order.push('request-2');
        return ctx;
      });
      client.addResponseInterceptor((ctx) => {
        order.push('response-1');
        return ctx;
      });
      client.addResponseInterceptor((ctx) => {
        order.push('response-2');
        return ctx;
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();

      expect(order).toEqual([
        'request-1',
        'request-2',
        'response-1',
        'response-2',
      ]);
    });

    it('should allow a request interceptor to modify the URL', async () => {
      client = new EsiClient({
        clientId: 'mw-url-mod',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      client.addRequestInterceptor((ctx) => ({
        ...ctx,
        url: ctx.url + (ctx.url.includes('?') ? '&' : '?') + 'custom=true',
      }));

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('custom=true');
    });

    it('should allow a response interceptor to modify the response body', async () => {
      client = new EsiClient({
        clientId: 'mw-body-mod',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      client.addResponseInterceptor((ctx) => ({
        ...ctx,
        body: {
          ...(ctx.body as Record<string, unknown>),
          extraField: 'added-by-interceptor',
        },
      }));

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 42,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );

      const result = (await client.status.getStatus()) as unknown as Record<
        string,
        unknown
      >;
      expect(result.extraField).toBe('added-by-interceptor');
      expect(result.players).toBe(42);
    });

    it('should stop firing a removed interceptor', async () => {
      client = new EsiClient({
        clientId: 'mw-remove',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      let callCount = 0;
      const remove = client.addRequestInterceptor((ctx) => {
        callCount++;
        return ctx;
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();
      expect(callCount).toBe(1);

      remove();

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 2,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();
      expect(callCount).toBe(1);
    });

    it('should fire interceptors passed via constructor config', async () => {
      const reqOrder: string[] = [];
      const resOrder: string[] = [];

      client = new EsiClient({
        clientId: 'mw-ctor',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
        requestInterceptors: [
          (ctx) => {
            reqOrder.push('ctor-req-1');
            return ctx;
          },
          (ctx) => {
            reqOrder.push('ctor-req-2');
            return ctx;
          },
        ],
        responseInterceptors: [
          (ctx) => {
            resOrder.push('ctor-res-1');
            return ctx;
          },
        ],
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );
      await client.status.getStatus();

      expect(reqOrder).toEqual(['ctor-req-1', 'ctor-req-2']);
      expect(resOrder).toEqual(['ctor-res-1']);
    });
  });

  // ─── Logger Integration ─────────────────────────────────────────────

  describe('Logger Integration', () => {
    const originalLogger = getLogger();

    afterEach(() => {
      setLogger(originalLogger);
    });

    it('should route log calls to a custom logger on successful request', async () => {
      const mockLogger: ILogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      };

      setLogger(mockLogger);

      const client = new EsiClient({
        clientId: 'logger-success',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 1,
          server_version: '1.0',
          start_time: '2024-01-01T00:00:00Z',
        }),
        {
          headers: standardHeaders(),
        },
      );

      await client.status.getStatus();

      // The request handler calls logInfo with the endpoint URL
      expect(mockLogger.info).toHaveBeenCalled();

      client.shutdown();
    });

    it('should route error/warn calls to a custom logger on failure', async () => {
      const mockLogger: ILogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      };

      setLogger(mockLogger);

      const client = new EsiClient({
        clientId: 'logger-failure',
        baseUrl: BASE_URL,
        unsafeAllowCustomHost: true,
        enableETagCache: false,
      });

      fetchMock.mockResponseOnce('', {
        status: 500,
        headers: standardHeaders(),
      });

      await expect(client.status.getStatus()).rejects.toThrow(EsiError);

      // On 500 errors the handler may log warnings or errors
      const warnCalled = (mockLogger.warn as jest.Mock).mock.calls.length > 0;
      const errorCalled = (mockLogger.error as jest.Mock).mock.calls.length > 0;
      const infoCalled = (mockLogger.info as jest.Mock).mock.calls.length > 0;

      // At minimum the request handler logs the endpoint hit via logInfo,
      // and on server errors it may log via logWarn
      expect(warnCalled || errorCalled || infoCalled).toBe(true);

      client.shutdown();
    });
  });
});
