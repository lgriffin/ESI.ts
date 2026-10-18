/**
 * The pipeline's `ICache` over a `CacheStore`, the five-call port a shared
 * store (Redis, a file) implements. The pipeline also asks for an entry's
 * ETag, whether one exists, the entries under a path (to invalidate them
 * after a write) and statistics; this adapter answers those from the store's
 * own calls and from what it has seen.
 *
 * It can invalidate by path only the keys written in this process (every
 * client given one store shares one adapter, see `cacheFromStore`), and it
 * remembers at most `MAX_TRACKED_KEYS` of them: a store shared between
 * processes holds keys another process wrote, and those expire by their
 * retention instead. The `CacheStore` port has no way to list keys, so a
 * store that other processes share carries invalidations between them with
 * its optional `publishInvalidation` and `onInvalidate`: this adapter
 * publishes each path a write invalidates and each `clear()`, and on an event
 * from another holder drops the keys it wrote under that path and records the
 * write, so a read in flight here does not cache the pre-write body. Its
 * statistics count this process's reads and writes, not the store's contents.
 */
import type { CacheInvalidation, CacheStore } from '../ports/CacheStore';
import type { Clock } from '../ports/Clock';
import { nowOn } from '../clock';
import type { CacheEntry, ICache } from './ICache';
import { recordWrite } from './writeLog';

/** How many written keys the adapter remembers; the oldest is forgotten first. */
export const MAX_TRACKED_KEYS = 10_000;

export class CacheStoreCache implements ICache {
  /** The keys this adapter wrote, each with when it wrote it on its clock. */
  private readonly keys = new Map<string, number>();
  private hits = 0;
  private misses = 0;
  private readonly unsubscribe: (() => void) | undefined;

  constructor(
    private readonly store: CacheStore,
    private readonly clock: Clock | null = null,
  ) {
    this.unsubscribe = store.onInvalidate?.((event) => {
      this.applyRemote(event);
    });
  }

  /** An invalidation another holder of the store published. */
  private applyRemote(event: CacheInvalidation): void {
    if (event.kind === 'clear') {
      this.keys.clear();
      recordWrite(this, '');
      return;
    }
    this.dropLocal(event.path);
    recordWrite(this, event.path);
  }

  /** Deletes the keys this adapter wrote under `pathSegment`. */
  private dropLocal(pathSegment: string): number {
    let count = 0;
    for (const key of [...this.keys.keys()]) {
      if (!key.includes(pathSegment)) continue;
      this.keys.delete(key);
      if (this.store.delete(key)) count += 1;
    }
    return count;
  }

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
      // Ages are measured on the client's clock, so an entry this adapter
      // wrote carries the time it wrote it on that clock, whatever time base
      // the store stamps with.
      timestamp: this.keys.get(url) ?? entry.timestamp,
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
    this.keys.delete(url);
    this.keys.set(url, nowOn(this.clock));
    // A store expires entries on its own, unseen by the adapter; the bound
    // keeps the keys it remembers from growing with every URL ever written.
    while (this.keys.size > MAX_TRACKED_KEYS) {
      this.keys.delete(this.keys.keys().next().value as string);
    }
  }

  has(url: string): boolean {
    return this.store.get(url) !== null;
  }

  delete(url: string): boolean {
    this.keys.delete(url);
    return this.store.delete(url);
  }

  deleteByPath(pathSegment: string): number {
    const count = this.dropLocal(pathSegment);
    this.store.publishInvalidation?.({ kind: 'path', path: pathSegment });
    return count;
  }

  clear(): void {
    this.store.clear();
    this.keys.clear();
    this.hits = 0;
    this.misses = 0;
    this.store.publishInvalidation?.({ kind: 'clear' });
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
    this.unsubscribe?.();
    this.store.shutdown();
  }
}

const adapters = new WeakMap<CacheStore, CacheStoreCache>();

/**
 * The cache the pipeline uses for a supplied store: the store itself when it
 * already implements the pipeline's wider `ICache` (an `ETagCacheManager`, or
 * any `ICache` written for `ApiClient.setCache`), otherwise the adapter.
 * Every client given one store in this process shares one adapter, so a write
 * through one client invalidates the entries the others cached, and an
 * in-flight read in one does not re-cache what another's write invalidated.
 * The first client's clock stamps its writes.
 */
export function cacheFromStore(
  store: CacheStore,
  clock?: Clock | null,
): ICache {
  const wide = store as Partial<ICache>;
  if (
    typeof wide.getETag === 'function' &&
    typeof wide.has === 'function' &&
    typeof wide.deleteByPath === 'function' &&
    typeof wide.getStats === 'function'
  ) {
    return store as ICache;
  }
  let adapter = adapters.get(store);
  if (!adapter) {
    adapter = new CacheStoreCache(store, clock ?? null);
    adapters.set(store, adapter);
  }
  return adapter;
}
