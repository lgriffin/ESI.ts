import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { ICache, CacheEntry } from '../../../src/core/cache/ICache';
import { IRateLimiter } from '../../../src/core/rateLimiter/IRateLimiter';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

class MockCache implements ICache {
  private store = new Map<string, CacheEntry>();
  setCalls: Array<{ url: string; etag: string }> = [];

  get(url: string): CacheEntry | null {
    return this.store.get(url) ?? null;
  }

  getETag(url: string): string | null {
    const entry = this.store.get(url);
    return entry ? entry.etag : null;
  }

  set(
    url: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    customTtl?: number,
  ): void {
    this.setCalls.push({ url, etag });
    this.store.set(url, {
      etag,
      data,
      headers,
      timestamp: Date.now(),
      ttl: customTtl,
    });
  }

  has(url: string): boolean {
    return this.store.has(url);
  }

  delete(url: string): boolean {
    return this.store.delete(url);
  }

  deleteByPath(pathSegment: string): number {
    let count = 0;
    for (const key of Array.from(this.store.keys())) {
      if (key.includes(pathSegment)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }

  getStats() {
    return {
      totalEntries: this.store.size,
      maxEntries: 100,
      hits: 0,
      misses: 0,
      hitRate: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }

  shutdown(): void {
    this.store.clear();
  }
}

describe('Dependency Injection', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('ICache injection', () => {
    it('should use injected cache for ETag lookup', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const mockCache = new MockCache();
      client.setCache(mockCache);

      fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }), {
        headers: { etag: '"abc123"' },
      });

      await handleRequest(client, 'v1/status/', 'GET');

      expect(mockCache.setCalls).toHaveLength(1);
      expect(mockCache.setCalls[0].etag).toBe('"abc123"');
    });

    it('should send If-None-Match when cache has ETag', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const mockCache = new MockCache();
      mockCache.set(
        'https://esi.evetech.net/v1/status/',
        '"cached-etag"',
        { old: true },
        {},
      );
      client.setCache(mockCache);

      fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }), {
        headers: { etag: '"new-etag"' },
      });

      await handleRequest(client, 'v1/status/', 'GET');

      const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(requestHeaders['If-None-Match']).toBe('"cached-etag"');
    });

    it('should serve cached data on 304', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const mockCache = new MockCache();
      mockCache.set(
        'https://esi.evetech.net/v1/status/',
        '"etag-1"',
        { cached: true },
        { 'x-source': 'cache' },
      );
      client.setCache(mockCache);

      fetchMock.mockResponseOnce('', { status: 304 });

      const result = await handleRequest(client, 'v1/status/', 'GET');

      expect(result.fromCache).toBe(true);
      expect((result.body as Record<string, boolean>).cached).toBe(true);
    });
  });

  describe('IRateLimiter injection', () => {
    it('should use injected rate limiter', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      let checkCalled = false;
      let updateCalled = false;

      const mockLimiter: IRateLimiter = {
        async checkRateLimit() {
          checkCalled = true;
        },
        updateFromResponse(_headers, _statusCode) {
          updateCalled = true;
        },
        getStatus: () => ({
          remaining: 100,
          limit: 100,
          used: 0,
          group: null,
          errorLimitRemain: 100,
          errorLimitReset: 0,
          retryAfter: null,
          blockedUntil: 0,
        }),
        isBlocked: () => false,
        reset() {},
      };

      client.setRateLimiter(mockLimiter);

      fetchMock.mockResponseOnce(JSON.stringify({}));
      await handleRequest(client, 'v1/status/', 'GET');

      expect(checkCalled).toBe(true);
      expect(updateCalled).toBe(true);
    });
  });

  describe('CircuitBreaker injection', () => {
    it('should use injected circuit breaker', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const cb = new CircuitBreaker({ failureThreshold: 2 });
      client.setCircuitBreaker(cb);

      fetchMock.mockResponseOnce('', { status: 500 });

      try {
        await handleRequest(client, 'v1/status/', 'GET');
      } catch {
        // expected
      }

      const stats = cb.getStats();
      expect(stats.circuits['v1/status/']).toBeDefined();
      expect(stats.circuits['v1/status/'].failures).toBe(1);
    });

    it('should block requests when circuit is open', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const cb = new CircuitBreaker({ failureThreshold: 1 });
      client.setCircuitBreaker(cb);

      cb.recordFailure('v1/status/', 500);

      await expect(handleRequest(client, 'v1/status/', 'GET')).rejects.toThrow(
        'Circuit breaker open',
      );

      expect(fetchMock.mock.calls).toHaveLength(0);
    });
  });

  describe('isolation between clients', () => {
    it('should use different caches for different clients', async () => {
      const client1 = new ApiClient('test1', 'https://esi.evetech.net');
      const client2 = new ApiClient('test2', 'https://esi.evetech.net');
      client1.setRateLimiter(rateLimiter);
      client2.setRateLimiter(rateLimiter);

      const cache1 = new MockCache();
      const cache2 = new MockCache();
      client1.setCache(cache1);
      client2.setCache(cache2);

      fetchMock.mockResponseOnce(JSON.stringify({ from: 'c1' }), {
        headers: { etag: '"e1"' },
      });
      fetchMock.mockResponseOnce(JSON.stringify({ from: 'c2' }), {
        headers: { etag: '"e2"' },
      });

      await handleRequest(client1, 'v1/status/', 'GET');
      await handleRequest(client2, 'v1/status/', 'GET');

      expect(cache1.setCalls[0].etag).toBe('"e1"');
      expect(cache2.setCalls[0].etag).toBe('"e2"');
    });
  });
});
