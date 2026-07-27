export interface IDeduplicator {
  dedupe<T>(key: string, execute: () => Promise<T>): Promise<T>;
  readonly pending: number;
  clear(): void;
}
