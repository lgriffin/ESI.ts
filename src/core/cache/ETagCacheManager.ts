import { ApiClient } from '../ApiClient';
import { logInfo, logDebug } from '../logger/clientLog';
import { ICache, CacheEntry } from './ICache';

export type { CacheEntry } from './ICache';

export interface ETagCacheConfig {
  maxEntries?: number;
  defaultTtl?: number;
  cleanupInterval?: number;
}

export class ETagCacheManager implements ICache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: Required<ETagCacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;
  private hits: number = 0;
  private misses: number = 0;
  private client: ApiClient | null = null;

  setClient(client: ApiClient | null): void {
    this.client = client;
  }

  private log(
    level: 'info' | 'debug',
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const ctx =
      context && Object.keys(context).length > 0 ? context : undefined;
    const emit = level === 'info' ? logInfo : logDebug;
    emit(this.client, message, ctx);
  }

  constructor(config: ETagCacheConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      defaultTtl: config.defaultTtl ?? 5 * 60 * 1000, // 5 minutes default
      cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1 minute cleanup
    };

    this.startCleanupTimer();
    this.log(
      'info',
      `ETag cache manager initialized with ${this.config.maxEntries} max entries`,
      { maxEntries: this.config.maxEntries },
    );
  }

  /**
   * Get cached data if ETag matches
   */
  get(url: string): CacheEntry | null {
    const entry = this.cache.get(url);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(url);
      this.misses++;
      this.log('debug', `Cache entry expired for ${url}`, { url });
      return null;
    }

    this.hits++;
    this.log('debug', `Cache hit for ${url} with ETag ${entry.etag}`, { url });
    return entry;
  }

  /**
   * Get ETag for a URL (for If-None-Match header)
   */
  getETag(url: string): string | null {
    const entry = this.get(url);
    return entry ? entry.etag : null;
  }

  /**
   * Set cache entry
   */
  set(
    url: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    customTtl?: number,
  ): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      etag,
      data,
      headers,
      timestamp: Date.now(),
      ttl: customTtl ?? this.config.defaultTtl,
    };

    this.cache.set(url, entry);
    this.log('debug', `Cached response for ${url} with ETag ${etag}`, { url });
  }

  /**
   * Check if cached data exists and is valid
   */
  has(url: string): boolean {
    const entry = this.cache.get(url);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Clear specific cache entry
   */
  delete(url: string): boolean {
    return this.cache.delete(url);
  }

  /**
   * Delete all cache entries whose URL contains the given path segment
   */
  deleteByPath(pathSegment: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pathSegment)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.log(
        'debug',
        `Invalidated ${count} cache entries matching ${pathSegment}`,
        {
          count,
        },
      );
    }
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.log('info', 'ETag cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    maxEntries: number;
    hits: number;
    misses: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldest = Infinity;
    let newest = -Infinity;
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }
    const total = this.hits + this.misses;

    return {
      totalEntries: this.cache.size,
      maxEntries: this.config.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      oldestEntry: this.cache.size > 0 ? oldest : null,
      newestEntry: this.cache.size > 0 ? newest : null,
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<ETagCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'ETag cache configuration updated', {
      maxEntries: this.config.maxEntries,
    });
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const beforeSize = this.cache.size;

    for (const [url, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(url);
      }
    }

    const cleanedCount = beforeSize - this.cache.size;
    if (cleanedCount > 0) {
      this.log('debug', `Cleaned up ${cleanedCount} expired cache entries`, {
        cleanedCount,
      });
    }

    return cleanedCount;
  }

  /**
   * Shutdown cache manager
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.log('info', 'ETag cache manager shut down');
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log('debug', `Evicted oldest cache entry: ${oldestKey}`, {
        url: oldestKey,
      });
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    // Don't prevent process exit (important for test runners and CLI tools)
    this.cleanupTimer.unref();
  }
}
