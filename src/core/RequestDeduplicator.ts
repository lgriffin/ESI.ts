import { logDebug } from './logger/clientLog';
import { IDeduplicator } from './IDeduplicator';

export class RequestDeduplicator implements IDeduplicator {
  private inflight = new Map<string, Promise<unknown>>();
  private client: import('./ApiClient').ApiClient | null = null;

  setClient(client: import('./ApiClient').ApiClient | null): void {
    this.client = client;
  }

  async dedupe<T>(key: string, execute: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      if (this.client) {
        logDebug(this.client, `[Dedup] Coalescing request: ${key}`);
      }
      return existing as Promise<T>;
    }

    const promise = execute().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Drop the in-flight entries whose key contains `pathSegment`, so a call
   * made after a write cannot join a request sent before it.
   *
   * The requests themselves keep running and whoever already joined them still
   * gets their answer. Only the map entry goes, which is what new callers look
   * in. Matching is `includes`, the same rule ETagCacheManager.deleteByPath
   * uses, so one written path invalidates the cache and detaches the reads of
   * it by the same test.
   */
  detachByPath(pathSegment: string): number {
    let count = 0;
    for (const key of this.inflight.keys()) {
      if (key.includes(pathSegment)) {
        this.inflight.delete(key);
        count += 1;
      }
    }
    if (count > 0 && this.client) {
      logDebug(
        this.client,
        `[Dedup] Detached ${count} in-flight request(s) matching ${pathSegment} after a write`,
      );
    }
    return count;
  }

  get pending(): number {
    return this.inflight.size;
  }

  clear(): void {
    this.inflight.clear();
  }
}
