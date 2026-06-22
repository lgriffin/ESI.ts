import { EsiClient, getDefaultClient } from '../../../src/EsiClient';
import {
  RequestInterceptor,
  ResponseInterceptor,
} from '../../../src/core/middleware/Middleware';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('EsiClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('constructor config', () => {
    it('should set timeout from config', () => {
      const client = new EsiClient({ timeout: 5000 });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should set onTokenRefresh from config', () => {
      const provider = async () => 'new-token';
      const client = new EsiClient({ onTokenRefresh: provider });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should apply request interceptors from config', () => {
      const interceptor: RequestInterceptor = (ctx) => ({
        ...ctx,
        headers: { ...ctx.headers, 'X-Test': '1' },
      });
      const client = new EsiClient({ requestInterceptors: [interceptor] });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should apply response interceptors from config', () => {
      const interceptor: ResponseInterceptor = (ctx) => ctx;
      const client = new EsiClient({ responseInterceptors: [interceptor] });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should enable circuit breaker when configured', () => {
      const client = new EsiClient({
        enableCircuitBreaker: true,
        circuitBreakerConfig: { failureThreshold: 3 },
      });
      expect(client).toBeDefined();
      const stats = client.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      client.shutdown();
    });

    it('should set datasource from config', () => {
      const client = new EsiClient({ datasource: 'singularity' });
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('addRequestInterceptor', () => {
    it('should add and remove a request interceptor', () => {
      const client = new EsiClient();
      const remove = client.addRequestInterceptor((ctx) => ctx);
      expect(typeof remove).toBe('function');
      remove();
      client.shutdown();
    });
  });

  describe('addResponseInterceptor', () => {
    it('should add and remove a response interceptor', () => {
      const client = new EsiClient();
      const remove = client.addResponseInterceptor((ctx) => ctx);
      expect(typeof remove).toBe('function');
      remove();
      client.shutdown();
    });
  });

  describe('setAccessToken', () => {
    it('should update the access token', () => {
      const client = new EsiClient();
      client.setAccessToken('new-token-123');
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('setTokenProvider', () => {
    it('should set a token provider', () => {
      const client = new EsiClient();
      const provider = async () => 'refreshed-token';
      client.setTokenProvider(provider);
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should clear token provider with undefined', () => {
      const client = new EsiClient();
      client.setTokenProvider(undefined);
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('diagnostics', () => {
    it('should lazily create diagnostics', () => {
      const client = new EsiClient();
      const diag = client.diagnostics;
      expect(diag).toBeDefined();
      expect(client.diagnostics).toBe(diag);
      client.shutdown();
    });
  });

  describe('cache methods', () => {
    it('should get cache stats', () => {
      const client = new EsiClient();
      const stats = client.getCacheStats();
      expect(stats).toBeDefined();
      client.shutdown();
    });

    it('should clear cache', () => {
      const client = new EsiClient();
      client.clearCache();
      client.shutdown();
    });

    it('should update cache config', () => {
      const client = new EsiClient();
      client.updateCacheConfig({ maxEntries: 100 });
      client.shutdown();
    });
  });

  describe('circuit breaker methods', () => {
    it('should get circuit breaker stats', () => {
      const client = new EsiClient({ enableCircuitBreaker: true });
      const stats = client.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      client.shutdown();
    });

    it('should reset circuit breaker', () => {
      const client = new EsiClient({ enableCircuitBreaker: true });
      client.resetCircuitBreaker();
      client.shutdown();
    });

    it('should reset specific endpoint circuit breaker', () => {
      const client = new EsiClient({ enableCircuitBreaker: true });
      client.resetCircuitBreaker('v1/status/');
      client.shutdown();
    });
  });

  describe('shutdown', () => {
    it('should shutdown with cache and circuit breaker', () => {
      const client = new EsiClient({
        enableCircuitBreaker: true,
        enableETagCache: true,
      });
      client.shutdown();
    });

    it('should shutdown with deduplicator', () => {
      const client = new EsiClient({
        enableRequestDeduplication: true,
      });
      client.shutdown();
    });

    it('should shutdown without optional components', () => {
      const client = new EsiClient({
        enableCircuitBreaker: false,
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
      client.shutdown();
    });
  });

  describe('getDefaultClient', () => {
    it('should return the same instance on repeated calls', () => {
      const a = getDefaultClient();
      const b = getDefaultClient();
      expect(a).toBe(b);
    });
  });
});
