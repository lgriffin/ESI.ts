/**
 * The pipeline's `ICache` over a `CacheStore`, the five-call port a shared
 * store (Redis, a file) implements. The pipeline also asks for an entry's
 * ETag, whether one exists, the entries under a path (to invalidate them
 * after a write) and statistics; this adapter answers those from the store's
 * own calls and from what it has seen.
 *
 * It can invalidate by path only the keys it wrote itself: a store shared
 * between processes holds keys another process wrote, and those expire by
 * their retention instead. Its statistics count this runtime's reads and
 * writes, not the store's contents.
 */
import type { CacheStore } from '../ports/CacheStore';
import type { CacheEntry, ICache } from './ICache';

export class CacheStoreCache implements ICache {
  private readonly keys = new Set<string>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly store: CacheStore) {}

  get(url: string): CacheEntry | null {
    const entry = this.store.get(url);
    if (!entry) {
      this.keys.delete(url);
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    return {
      etag: entry.etag,
      data: entry.data,
      headers: { ...entry.headers },
      timestamp: entry.timestamp,
      ...(entry.ttl === undefined ? {} : { ttl: entry.ttl }),
    };
  }

  getETag(url: string): string | null {
    return this.get(url)?.etag ?? null;
  }

  set(
    url: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    customTtl?: number,
  ): void {
    this.store.set(url, etag, data, headers, customTtl);
    this.keys.add(url);
  }

  has(url: string): boolean {
    return this.store.get(url) !== null;
  }

  delete(url: string): boolean {
    this.keys.delete(url);
    return this.store.delete(url);
  }

  deleteByPath(pathSegment: string): number {
    let count = 0;
    for (const key of [...this.keys]) {
      if (!key.includes(pathSegment)) continue;
      this.keys.delete(key);
      if (this.store.delete(key)) count += 1;
    }
    return count;
  }

  clear(): void {
    this.store.clear();
    this.keys.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * This runtime's view of the store: the keys it wrote that it has not seen
   * expire, and its own hits and misses. `maxEntries` is 0, since the store
   * sets its own bound; the entry ages are not tracked.
   */
  getStats(): ReturnType<ICache['getStats']> {
    const total = this.hits + this.misses;
    return {
      totalEntries: this.keys.size,
      maxEntries: 0,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }

  shutdown(): void {
    this.store.shutdown();
  }
}

/**
 * The cache the pipeline uses for a supplied store: the store itself when it
 * already implements the pipeline's wider `ICache` (an `ETagCacheManager`, or
 * a cache written against the legacy builder), otherwise the adapter.
 */
export function cacheFromStore(store: CacheStore): ICache {
  const wide = store as Partial<ICache>;
  if (
    typeof wide.getETag === 'function' &&
    typeof wide.has === 'function' &&
    typeof wide.deleteByPath === 'function' &&
    typeof wide.getStats === 'function'
  ) {
    return store as ICache;
  }
  return new CacheStoreCache(store);
}
