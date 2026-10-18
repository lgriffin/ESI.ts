/**
 * Where conditional-request caching keeps response bodies and their ETags,
 * keyed by request URL. `ETagCacheManager` is the in-memory implementation; a
 * shared store (Redis, a file) implements the same five calls, and may add
 * the optional pair that carries invalidations between the processes sharing
 * it (`publishInvalidation` and `onInvalidate`).
 */

export interface CachedResponse {
  readonly etag: string;
  readonly data: unknown;
  readonly headers: Readonly<Record<string, string>>;
  /** When the entry was written, in milliseconds since the epoch. */
  readonly timestamp: number;
  /**
   * How long the store keeps the entry, in milliseconds, when not the store's
   * default. This is retention, not freshness: the pipeline passes the
   * response's freshness plus a stale-retention window, so the body stays
   * available for `If-None-Match` revalidation and stale-on-error after it
   * stops being fresh. A store drops the entry only once this has passed.
   */
  readonly ttl?: number;
}

/**
 * An invalidation one holder of a shared store tells the others about: the
 * entries under a request path after a successful write to it, or every
 * entry after `clear()`. Deleting one key needs no event, since the store's
 * own `delete` already removes it for every holder.
 */
export type CacheInvalidation =
  { readonly kind: 'path'; readonly path: string } | { readonly kind: 'clear' };

export interface CacheStore {
  /** The entry for `key`, or null when there is none or it has expired. */
  get(key: string): CachedResponse | null;
  set(
    key: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    /** Retention in milliseconds, as for `CachedResponse.ttl`. */
    ttlMs?: number,
  ): void;
  delete(key: string): boolean;
  clear(): void;
  /** Releases timers and connections; the store is not used afterwards. */
  shutdown(): void;
  /**
   * Optional: tells every other holder of the store, in this process or
   * another, about an invalidation, for example over Redis pub/sub. The
   * pipeline calls it after a write invalidates a path and after `clear()`.
   */
  publishInvalidation?(event: CacheInvalidation): void;
  /**
   * Optional: calls `listener` for each invalidation another holder
   * published, and returns the call that stops it. The pipeline then drops
   * the entries it wrote under that path and stops its in-flight reads of it
   * from caching what they fetched. Delivering a holder's own event back to
   * it is harmless. A store without this member invalidates only what this
   * process wrote, and other processes keep serving their entries until the
   * entries expire.
   */
  onInvalidate?(listener: (event: CacheInvalidation) => void): () => void;
}
