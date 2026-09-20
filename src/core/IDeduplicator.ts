export interface IDeduplicator {
  dedupe<T>(key: string, execute: () => Promise<T>): Promise<T>;
  readonly pending: number;
  clear(): void;
  /**
   * Stop new callers joining in-flight requests whose key contains
   * `pathSegment`, and report how many were detached.
   *
   * Called after a write succeeds. A read that starts after a DELETE has
   * completed must not be answered by a GET that was sent before it: the
   * response is pre-write data, and the caller has every reason to expect
   * otherwise. Detaching leaves the in-flight request running and its existing
   * joiners untouched — they asked before the write and their answer is still
   * the one they asked for. It only removes the entry new callers would join.
   *
   * Optional, so a deduplicator written against an earlier version of this
   * interface still satisfies it. A deduplicator that does not implement it
   * keeps the old behaviour, which is why the pipeline calls it with `?.`.
   */
  detachByPath?(pathSegment: string): number;
}
