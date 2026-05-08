import { ApiClient } from './ApiClient';
import { ETagCacheManager, ETagCacheConfig } from './cache/ETagCacheManager';
import { RequestDeduplicator } from './RequestDeduplicator';

export interface CacheStats {
  totalEntries: number;
  maxEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

export interface CircuitBreakerStats {
  totalCircuits: number;
  openCircuits: number;
  circuits: Record<
    string,
    { state: 'closed' | 'open' | 'half-open'; failures: number }
  >;
}

export class EsiDiagnostics {
  constructor(
    private apiClient: ApiClient,
    private etagCacheEnabled: boolean,
    private deduplicator: RequestDeduplicator | null,
  ) {}

  getCacheStats(): CacheStats | null {
    if (!this.etagCacheEnabled) return null;
    const cache = this.apiClient.getCache();
    return cache ? (cache as ETagCacheManager).getStats() : null;
  }

  clearCache(): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).clear();
    }
  }

  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).updateConfig(newConfig);
    }
  }

  getCircuitBreakerStats(): CircuitBreakerStats | null {
    const cb = this.apiClient.getCircuitBreaker();
    return cb ? cb.getStats() : null;
  }

  resetCircuitBreaker(endpoint?: string): void {
    const cb = this.apiClient.getCircuitBreaker();
    if (cb) {
      cb.reset(endpoint);
    }
  }

  getDeduplicatorStats(): { pendingRequests: number } | null {
    return this.deduplicator
      ? { pendingRequests: this.deduplicator.pending }
      : null;
  }
}
