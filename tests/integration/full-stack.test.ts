import { EsiClient } from '../../src/EsiClient';
import { EsiClientBuilder, EsiApiFactory } from '../../src/EsiClientBuilder';
import {
  resetETagCache,
  resetCircuitBreaker,
} from '../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../src/core/rateLimiter/RateLimiter';
import { EsiError } from '../../src/core/util/error';
import { ICache, CacheEntry } from '../../src/core/cache/ICache';
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

function resetGlobals() {
  fetchMock.resetMocks();
  resetETagCache();
  resetCircuitBreaker();
  const rl = RateLimiter.getInstance();
  rl.reset();
  rl.setTestMode(true);
}

describe('Integration: Full Request Lifecycle', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'integration-test',
      baseUrl: BASE_URL,
      enableETagCache: true,
      etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should flow from EsiClient.status through the full stack and return typed data', async () => {
    const mockStatus = {
      players: 23456,
      server_version: '2345678',
      start_time: '2024-01-01T00:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(mockStatus), {
      headers: standardHeaders(),
    });

    const result = await client.status.getStatus();
    expect(result).toEqual(mockStatus);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`${BASE_URL}/status`);
  });

  it('should flow from EsiClient.market.getMarketPrices through the full stack', async () => {
    const mockPrices = [
      { type_id: 34, average_price: 5.5, adjusted_price: 5.2 },
      { type_id: 35, average_price: 10.0 },
    ];
    fetchMock.mockResponseOnce(JSON.stringify(mockPrices), {
      headers: standardHeaders(),
    });

    const result = await client.market.getMarketPrices();
    expect(result).toEqual(mockPrices);
    expect(result).toHaveLength(2);
    expect(result[0].type_id).toBe(34);
  });

  it('should include authorization header for authenticated endpoints', async () => {
    client.setAccessToken('test-auth-token-123');
    fetchMock.mockResponseOnce(JSON.stringify([]), {
      headers: standardHeaders(),
    });

    await client.market.getCharacterOrders(12345);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(headers['Authorization']).toBe('Bearer test-auth-token-123');
  });
});

describe('Integration: ETag Cache Round-Trip', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'etag-integration',
      baseUrl: BASE_URL,
      enableETagCache: true,
      etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should cache first response and use If-None-Match on second request', async () => {
    const data = {
      players: 10000,
      server_version: '1',
      start_time: '2024-01-01T00:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(data), {
      headers: standardHeaders({ etag: '"abc123"' }),
    });

    const first = await client.status.getStatus();
    expect(first).toEqual(data);

    fetchMock.mockResponseOnce('', {
      status: 304,
      headers: standardHeaders({ etag: '"abc123"' }),
    });

    const second = await client.status.getStatus();
    expect(second).toEqual(data);

    const secondHeaders = fetchMock.mock.calls[1][1]?.headers as Record<
      string,
      string
    >;
    expect(secondHeaders['If-None-Match']).toBe('"abc123"');
  });

  it('should report cache stats after caching', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }), {
      headers: standardHeaders({ etag: '"etag1"' }),
    });
    await client.status.getStatus();

    const stats = client.getCacheStats();
    expect(stats).not.toBeNull();
    expect(stats!.totalEntries).toBeGreaterThanOrEqual(1);
  });
});

describe('Integration: Circuit Breaker Trip and Recovery', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'cb-integration',
      baseUrl: BASE_URL,
      enableETagCache: false,
      enableCircuitBreaker: true,
      circuitBreakerConfig: {
        failureThreshold: 3,
        resetTimeoutMs: 500,
        halfOpenMaxAttempts: 1,
      },
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should open circuit after consecutive 5xx failures and block further requests', async () => {
    for (let i = 0; i < 3; i++) {
      fetchMock.mockResponseOnce('', {
        status: 500,
        headers: standardHeaders(),
      });
    }

    for (let i = 0; i < 3; i++) {
      await expect(client.status.getStatus()).rejects.toThrow(EsiError);
    }

    await expect(client.status.getStatus()).rejects.toThrow(
      /Circuit breaker open/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should recover after timeout with successful probe', async () => {
    for (let i = 0; i < 3; i++) {
      fetchMock.mockResponseOnce('', {
        status: 500,
        headers: standardHeaders(),
      });
    }
    for (let i = 0; i < 3; i++) {
      await expect(client.status.getStatus()).rejects.toThrow(EsiError);
    }

    await new Promise((r) => setTimeout(r, 600));

    const data = {
      players: 5000,
      server_version: '1',
      start_time: '2024-01-01T00:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(data), {
      headers: standardHeaders(),
    });
    const result = await client.status.getStatus();
    expect(result).toEqual(data);

    const cbStats = client.getCircuitBreakerStats();
    expect(cbStats).not.toBeNull();
    expect(cbStats!.openCircuits).toBe(0);
  });
});

describe('Integration: Middleware Pipeline', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'mw-integration',
      baseUrl: BASE_URL,
      enableETagCache: false,
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should apply request interceptor headers to outgoing requests', async () => {
    client.addRequestInterceptor((ctx) => ({
      ...ctx,
      headers: { ...ctx.headers, 'X-Trace-Id': 'trace-abc-123' },
    }));

    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }), {
      headers: standardHeaders(),
    });
    await client.status.getStatus();

    const sentHeaders = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(sentHeaders['X-Trace-Id']).toBe('trace-abc-123');
  });

  it('should apply response interceptor to transform response body', async () => {
    client.addResponseInterceptor((ctx) => ({
      ...ctx,
      body: { ...(ctx.body as Record<string, unknown>), injected: true },
    }));

    fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }), {
      headers: standardHeaders(),
    });
    const result = (await client.status.getStatus()) as unknown as Record<
      string,
      unknown
    >;
    expect(result.injected).toBe(true);
    expect(result.players).toBe(100);
  });

  it('should fire interceptors in registration order', async () => {
    const order: string[] = [];
    client.addRequestInterceptor((ctx) => {
      order.push('req-1');
      return ctx;
    });
    client.addRequestInterceptor((ctx) => {
      order.push('req-2');
      return ctx;
    });
    client.addResponseInterceptor((ctx) => {
      order.push('res-1');
      return ctx;
    });
    client.addResponseInterceptor((ctx) => {
      order.push('res-2');
      return ctx;
    });

    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }), {
      headers: standardHeaders(),
    });
    await client.status.getStatus();

    expect(order).toEqual(['req-1', 'req-2', 'res-1', 'res-2']);
  });

  it('should allow removing an interceptor at runtime', async () => {
    let called = false;
    const remove = client.addRequestInterceptor((ctx) => {
      called = true;
      return ctx;
    });

    remove();

    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }), {
      headers: standardHeaders(),
    });
    await client.status.getStatus();
    expect(called).toBe(false);
  });
});

describe('Integration: Token Refresh Flow', () => {
  beforeEach(() => {
    resetGlobals();
  });

  it('should retry with refreshed token after 401', async () => {
    let tokenVersion = 0;
    const client = new EsiClient({
      clientId: 'token-integration',
      baseUrl: BASE_URL,
      accessToken: 'expired-token',
      enableETagCache: false,
      onTokenRefresh: async () => {
        tokenVersion++;
        return `fresh-token-${tokenVersion}`;
      },
    });

    fetchMock.mockResponseOnce('', {
      status: 401,
      headers: standardHeaders(),
    });
    fetchMock.mockResponseOnce(JSON.stringify([{ order_id: 1 }]), {
      headers: standardHeaders(),
    });

    const result = await client.market.getCharacterOrders(12345);
    expect(result).toEqual([{ order_id: 1 }]);

    const retryHeaders = fetchMock.mock.calls[1][1]?.headers as Record<
      string,
      string
    >;
    expect(retryHeaders['Authorization']).toBe('Bearer fresh-token-1');

    client.shutdown();
  });
});

describe('Integration: Pagination Assembly', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'pagination-integration',
      baseUrl: BASE_URL,
      enableETagCache: false,
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should assemble multi-page responses into a single array', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([1, 2, 3]), {
      headers: standardHeaders({ 'x-pages': '3' }),
    });
    fetchMock.mockResponseOnce(JSON.stringify([4, 5, 6]), {
      headers: standardHeaders({ 'x-pages': '3' }),
    });
    fetchMock.mockResponseOnce(JSON.stringify([7, 8, 9]), {
      headers: standardHeaders({ 'x-pages': '3' }),
    });

    const result = await client.market.getMarketGroups();
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('Integration: Error Propagation', () => {
  let client: EsiClient;

  beforeEach(() => {
    resetGlobals();
    client = new EsiClient({
      clientId: 'error-integration',
      baseUrl: BASE_URL,
      enableETagCache: false,
    });
  });

  afterEach(() => {
    client.shutdown();
  });

  it('should throw EsiError with correct status on 404', async () => {
    fetchMock.mockResponseOnce('', {
      status: 404,
      headers: standardHeaders(),
    });

    try {
      await client.status.getStatus();
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EsiError);
      expect((e as EsiError).statusCode).toBe(404);
    }
  });

  it('should throw EsiError with correct status on 403', async () => {
    fetchMock.mockResponseOnce('', {
      status: 403,
      headers: standardHeaders(),
    });

    try {
      await client.market.getMarketPrices();
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EsiError);
      expect((e as EsiError).statusCode).toBe(403);
    }
  });

  it('should serve stale cache on 5xx when cache is available', async () => {
    const cachedClient = new EsiClient({
      clientId: 'stale-cache-test',
      baseUrl: BASE_URL,
      enableETagCache: true,
      etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
    });

    const data = {
      players: 999,
      server_version: '1',
      start_time: '2024-01-01T00:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(data), {
      headers: standardHeaders({ etag: '"stale1"' }),
    });
    await cachedClient.status.getStatus();

    fetchMock.mockResponseOnce('', {
      status: 500,
      headers: standardHeaders(),
    });
    const result = await cachedClient.status.getStatus();
    expect(result).toEqual(data);

    cachedClient.shutdown();
  });
});

describe('Integration: Client Creation Patterns', () => {
  beforeEach(() => {
    resetGlobals();
  });

  it('should produce a working client via EsiClient constructor', async () => {
    const client = new EsiClient({
      clientId: 'pattern-full',
      baseUrl: BASE_URL,
      enableETagCache: false,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }), {
      headers: standardHeaders(),
    });
    const result = await client.status.getStatus();
    expect(result.players).toBe(1);
    client.shutdown();
  });

  it('should produce a working client via EsiClientBuilder', async () => {
    const custom = new EsiClientBuilder()
      .addClients(['status', 'market'])
      .withConfig({ clientId: 'pattern-builder', baseUrl: BASE_URL })
      .build();

    expect(custom.hasClient('status')).toBe(true);
    expect(custom.hasClient('market')).toBe(true);
    expect(custom.hasClient('alliance')).toBe(false);

    fetchMock.mockResponseOnce(JSON.stringify({ players: 42 }), {
      headers: standardHeaders(),
    });
    const result = await custom.status!.getStatus();
    expect(result.players).toBe(42);
    custom.shutdown();
  });

  it('should produce a working client via EsiApiFactory', async () => {
    const marketClient = EsiApiFactory.createMarketClient({
      clientId: 'pattern-factory',
      baseUrl: BASE_URL,
    });
    fetchMock.mockResponseOnce(
      JSON.stringify([{ type_id: 34, average_price: 5.0 }]),
      { headers: standardHeaders() },
    );
    const result = await marketClient.getMarketPrices();
    expect(result[0].type_id).toBe(34);
  });
});

describe('Integration: DI Isolation', () => {
  beforeEach(() => {
    resetGlobals();
  });

  it('should isolate injected caches between two clients', async () => {
    class TrackingCache implements ICache {
      items = new Map<string, CacheEntry>();
      label: string;
      constructor(label: string) {
        this.label = label;
      }
      get(url: string): CacheEntry | null {
        return this.items.get(url) ?? null;
      }
      getETag(url: string): string | null {
        const e = this.items.get(url);
        return e ? e.etag : null;
      }
      set(
        url: string,
        etag: string,
        data: unknown,
        headers: Record<string, string>,
        ttl?: number,
      ): void {
        this.items.set(url, {
          etag,
          data,
          headers,
          timestamp: Date.now(),
          ttl,
        });
      }
      has(url: string): boolean {
        return this.items.has(url);
      }
      delete(url: string): boolean {
        return this.items.delete(url);
      }
      deleteByPath(seg: string): number {
        let count = 0;
        for (const key of this.items.keys()) {
          if (key.includes(seg)) {
            this.items.delete(key);
            count++;
          }
        }
        return count;
      }
      clear(): void {
        this.items.clear();
      }
      getStats() {
        return {
          totalEntries: this.items.size,
          maxEntries: 100,
          hits: 0,
          misses: 0,
          hitRate: 0,
          oldestEntry: null,
          newestEntry: null,
        };
      }
      shutdown(): void {
        this.items.clear();
      }
    }

    const cacheA = new TrackingCache('A');
    const cacheB = new TrackingCache('B');

    const { ApiClient } = await import('../../src/core/ApiClient');
    const { handleRequest } = await import('../../src/core/ApiRequestHandler');

    const clientA = new ApiClient('a', BASE_URL, undefined);
    clientA.setCache(cacheA);

    const clientB = new ApiClient('b', BASE_URL, undefined);
    clientB.setCache(cacheB);

    fetchMock.mockResponseOnce(JSON.stringify({ a: 1 }), {
      headers: { ...standardHeaders(), etag: '"etag-a"' },
    });
    await handleRequest(clientA, 'status', 'GET', undefined, false, true);

    fetchMock.mockResponseOnce(JSON.stringify({ b: 2 }), {
      headers: { ...standardHeaders(), etag: '"etag-b"' },
    });
    await handleRequest(clientB, 'status', 'GET', undefined, false, true);

    expect(cacheA.items.size).toBe(1);
    expect(cacheB.items.size).toBe(1);

    const aEntry = cacheA.items.values().next().value as CacheEntry;
    const bEntry = cacheB.items.values().next().value as CacheEntry;
    expect(aEntry.data).toEqual({ a: 1 });
    expect(bEntry.data).toEqual({ b: 2 });
  });
});
