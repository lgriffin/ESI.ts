/**
 * Where conditional-request caching keeps response bodies and their ETags,
 * keyed by request URL. `ETagCacheManager` is the in-memory implementation; a
 * shared store (Redis, a file) implements the same five calls.
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
}
