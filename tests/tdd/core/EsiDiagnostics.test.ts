import { EsiDiagnostics } from '../../../src/core/EsiDiagnostics';
import { ApiClient } from '../../../src/core/ApiClient';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

describe('EsiDiagnostics', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const limiter = new RateLimiter();
    limiter.setTestMode(true);
    apiClient.setRateLimiter(limiter);
  });

  describe('getCacheStats', () => {
    it('should return null when cache is disabled', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(diag.getCacheStats()).toBeNull();
    });

    it('should return null when cache is enabled but not set on client', () => {
      const diag = new EsiDiagnostics(apiClient, true, null);
      expect(diag.getCacheStats()).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should not throw when no cache is set', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(() => diag.clearCache()).not.toThrow();
    });
  });

  describe('updateCacheConfig', () => {
    it('should not throw when no cache is set', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(() => diag.updateCacheConfig({ maxEntries: 500 })).not.toThrow();
    });
  });

  describe('getCircuitBreakerStats', () => {
    it('should return null when no circuit breaker is configured', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(diag.getCircuitBreakerStats()).toBeNull();
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should not throw when no circuit breaker is configured', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(() => diag.resetCircuitBreaker()).not.toThrow();
    });
  });

  describe('getDeduplicatorStats', () => {
    it('should return null when deduplicator is not configured', () => {
      const diag = new EsiDiagnostics(apiClient, false, null);
      expect(diag.getDeduplicatorStats()).toBeNull();
    });

    it('should return pending count when deduplicator is configured', () => {
      const dedup = new RequestDeduplicator();
      const diag = new EsiDiagnostics(apiClient, false, dedup);

      const stats = diag.getDeduplicatorStats();
      expect(stats).toEqual({ pendingRequests: 0 });
    });

    it('should reflect in-flight requests', () => {
      const dedup = new RequestDeduplicator();
      const diag = new EsiDiagnostics(apiClient, false, dedup);

      dedup.dedupe('key1', () => new Promise(() => {}));
      const stats = diag.getDeduplicatorStats();
      expect(stats).toEqual({ pendingRequests: 1 });

      dedup.clear();
    });
  });
});
