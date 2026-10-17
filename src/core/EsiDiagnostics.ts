import { ApiClient } from './ApiClient';
import type {
  ETagCacheManager,
  ETagCacheConfig,
} from './cache/ETagCacheManager';
import type { IDeduplicator } from './IDeduplicator';

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
    private deduplicator: IDeduplicator | null,
  ) {}

  getCacheStats(): CacheStats | null {
    if (!this.etagCacheEnabled) return null;
    const cache = this.apiClient.getCache();
    return cache ? cache.getStats() : null;
  }

  clearCache(): void {
    this.apiClient.getCache()?.clear();
  }

  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    // Only the built-in cache has a configuration; a supplied cache keeps its own.
    const cache = this.apiClient.getCache() as Partial<ETagCacheManager> | null;
    cache?.updateConfig?.(newConfig);
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
