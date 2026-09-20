export interface CacheEntry {
  etag: string;
  data: unknown;
  headers: Record<string, string>;
  timestamp: number;
  ttl?: number;
}

export interface ICache {
  get(url: string): CacheEntry | null;
  getETag(url: string): string | null;
  set(
    url: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    customTtl?: number,
  ): void;
  has(url: string): boolean;
  delete(url: string): boolean;
  deleteByPath(pathSegment: string): number;
  clear(): void;
  getStats(): {
    totalEntries: number;
    maxEntries: number;
    hits: number;
    misses: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  };
  shutdown(): void;
}
