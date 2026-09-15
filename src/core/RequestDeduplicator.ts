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

  get pending(): number {
    return this.inflight.size;
  }

  clear(): void {
    this.inflight.clear();
  }
}
