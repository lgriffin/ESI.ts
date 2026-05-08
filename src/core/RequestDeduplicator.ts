import { logDebug } from './logger/loggerUtil';

export class RequestDeduplicator {
  private inflight = new Map<string, Promise<unknown>>();

  async dedupe<T>(key: string, execute: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) {
      logDebug(`[Dedup] Coalescing request: ${key}`);
      return existing as Promise<T>;
    }

    const promise = execute().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  get pending(): number {
    return this.inflight.size;
  }

  clear(): void {
    this.inflight.clear();
  }
}
