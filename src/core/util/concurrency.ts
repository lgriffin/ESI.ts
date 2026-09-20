export const DEFAULT_CONCURRENCY = 5;

export interface ConcurrencyOptions {
  /**
   * Maximum number of workers running at once. Defaults to 5. A value that
   * is not a finite number falls back to the default; fractions are floored
   * and anything below one runs a single worker.
   */
  concurrency?: number;
  /**
   * Called after each item settles with the running completed count. An
   * exception thrown by the callback is discarded so it cannot stop the run
   * or leave later items without a result.
   */
  onProgress?: (completed: number, total: number) => void;
}

function resolveLimit(requested: number | undefined): number {
  if (typeof requested !== 'number' || !Number.isFinite(requested)) {
    return DEFAULT_CONCURRENCY;
  }
  return Math.max(1, Math.floor(requested));
}

export type SettledResult<T> =
  { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown };

/**
 * Run `worker` over every item with at most `concurrency` invocations in
 * flight at once. Results are returned in input order and every item settles
 * independently: a rejection is captured, never thrown.
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  options: ConcurrencyOptions = {},
): Promise<SettledResult<R>[]> {
  const limit = resolveLimit(options.concurrency);
  // Every index is written before this returns (at least one worker drains
  // the queue, and both outcomes assign), so the array ends dense without
  // presizing it.
  const results: SettledResult<R>[] = [];
  let nextIndex = 0;
  let completed = 0;

  async function runOne(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index] as T;
      try {
        const value = await worker(item, index);
        results[index] = { status: 'fulfilled', value };
      } catch (reason: unknown) {
        results[index] = { status: 'rejected', reason };
      }
      completed++;
      if (options.onProgress) {
        try {
          options.onProgress(completed, items.length);
        } catch {
          // Progress reporting is advisory; see ConcurrencyOptions.onProgress.
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    runOne(),
  );
  await Promise.all(workers);
  return results;
}
