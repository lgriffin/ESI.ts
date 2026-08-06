import { ApiClient } from '../../../src/core/ApiClient';
import { ICache, CacheEntry } from '../../../src/core/cache/ICache';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';

function createMockCache(): ICache & { clearCalled: number } {
  const store = new Map<string, CacheEntry>();
  return {
    clearCalled: 0,
    get(url: string): CacheEntry | null {
      return store.get(url) ?? null;
    },
    getETag(url: string): string | null {
      return store.get(url)?.etag ?? null;
    },
    set(
      url: string,
      etag: string,
      data: unknown,
      headers: Record<string, string>,
      customTtl?: number,
    ): void {
      store.set(url, {
        etag,
        data,
        headers,
        timestamp: Date.now(),
        ttl: customTtl,
      });
    },
    has(url: string): boolean {
      return store.has(url);
    },
    delete(url: string): boolean {
      return store.delete(url);
    },
    deleteByPath(pathSegment: string): number {
      let count = 0;
      for (const key of store.keys()) {
        if (key.includes(pathSegment)) {
          store.delete(key);
          count++;
        }
      }
      return count;
    },
    clear() {
      store.clear();
      this.clearCalled++;
    },
    getStats() {
      return {
        totalEntries: store.size,
        maxEntries: 1000,
        hits: 0,
        misses: 0,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    },
    shutdown(): void {},
  };
}

describe('ApiClient', () => {
  describe('setAccessToken cache clearing', () => {
    it('should clear the cache when token changes', () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'old-token',
      );
      const cache = createMockCache();
      client.setCache(cache);
      cache.set(
        'https://esi.evetech.net/some/endpoint',
        'etag1',
        { data: 'cached' },
        {},
      );

      client.setAccessToken('new-token');

      expect(cache.clearCalled).toBe(1);
    });

    it('should not clear the cache when setting the same token', () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'same-token',
      );
      const cache = createMockCache();
      client.setCache(cache);

      client.setAccessToken('same-token');

      expect(cache.clearCalled).toBe(0);
    });

    it('should handle setAccessToken when no cache is configured', () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'old-token',
      );

      expect(() => client.setAccessToken('new-token')).not.toThrow();
    });
  });

  describe('refreshToken cache clearing', () => {
    it('should clear the cache when provider returns a new token', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'old-token',
      );
      const cache = createMockCache();
      client.setCache(cache);
      client.setTokenProvider(() => Promise.resolve('new-token'));

      await client.refreshToken();

      expect(cache.clearCalled).toBe(1);
    });

    it('should not clear the cache when provider returns the same token', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'same-token',
      );
      const cache = createMockCache();
      client.setCache(cache);
      client.setTokenProvider(() => Promise.resolve('same-token'));

      await client.refreshToken();

      expect(cache.clearCalled).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should report no middleware when none configured', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      const status = JSON.parse(JSON.stringify(client));

      expect(status.hasCache).toBe(false);
      expect(status.hasRateLimiter).toBe(false);
      expect(status.hasCircuitBreaker).toBe(false);
      expect(status.hasDeduplicator).toBe(false);
      expect(status.hasTokenProvider).toBe(false);
    });

    it('should report true for each configured middleware', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      const rateLimiter = new RateLimiter();
      rateLimiter.setTestMode(true);
      client.setRateLimiter(rateLimiter);
      client.setCache(createMockCache());
      client.setCircuitBreaker(new CircuitBreaker());
      client.setDeduplicator(new RequestDeduplicator());
      client.setTokenProvider(() => Promise.resolve('token'));

      const status = JSON.parse(JSON.stringify(client));

      expect(status.hasCache).toBe(true);
      expect(status.hasRateLimiter).toBe(true);
      expect(status.hasCircuitBreaker).toBe(true);
      expect(status.hasDeduplicator).toBe(true);
      expect(status.hasTokenProvider).toBe(true);
    });
  });

  describe('toJSON serialization protection', () => {
    it('should not expose accessToken in JSON output', () => {
      const client = new ApiClient(
        'my-client-id',
        'https://esi.evetech.net',
        'secret-token-123',
      );
      const json = JSON.stringify(client);

      expect(json).not.toContain('secret-token-123');
      expect(json).not.toContain('my-client-id');
      expect(json).not.toContain('accessToken');
      expect(json).not.toContain('clientId');
    });

    it('should include safe fields in JSON output', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setTimeout(15000);
      client.setDatasource('tranquility');

      const parsed = JSON.parse(JSON.stringify(client));

      expect(parsed.link).toBe('https://esi.evetech.net');
      expect(parsed.timeout).toBe(15000);
      expect(parsed.datasource).toBe('tranquility');
      expect(parsed.hasCache).toBe(false);
      expect(parsed.validateResponse).toBe(true);
    });
  });
});
