import type {
  CachedResponse,
  CacheInvalidation,
  CacheStore,
} from '../../../src/core/ports/CacheStore';

/**
 * The reference shared store for the `CacheStore` invalidation pair: one
 * map and one bus, with `connect()` handing out a store per "process". A
 * handle publishes to every other handle, as Redis pub/sub would; the copy
 * in guides/USAGE.md is this class.
 */
export class SharedMemoryCacheStore {
  readonly entries = new Map<string, CachedResponse>();
  private readonly listeners = new Map<
    object,
    Set<(event: CacheInvalidation) => void>
  >();
  readonly published: CacheInvalidation[] = [];

  connect(): CacheStore {
    const handle = {};
    const mine = new Set<(event: CacheInvalidation) => void>();
    this.listeners.set(handle, mine);
    return {
      get: (key) => this.entries.get(key) ?? null,
      set: (key, etag, data, headers, ttlMs) => {
        this.entries.set(key, {
          etag,
          data,
          headers,
          timestamp: Date.now(),
          ...(ttlMs === undefined ? {} : { ttl: ttlMs }),
        });
      },
      delete: (key) => this.entries.delete(key),
      clear: () => this.entries.clear(),
      shutdown: () => {
        this.listeners.delete(handle);
      },
      publishInvalidation: (event) => {
        this.published.push(event);
        for (const [other, set] of this.listeners) {
          if (other === handle) continue;
          for (const listener of set) listener(event);
        }
      },
      onInvalidate: (listener) => {
        mine.add(listener);
        return () => mine.delete(listener);
      },
    };
  }

  /** How many listeners are subscribed across every handle. */
  get subscribers(): number {
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }
}
