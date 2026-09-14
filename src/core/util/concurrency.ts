export interface ConcurrencyOptions {
  /** Maximum number of workers running at once. Defaults to 5. */
  concurrency?: number;
  /** Called after each item settles with the running completed count. */
  onProgress?: (completed: number, total: number) => void;
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
  const limit = Math.max(1, Math.floor(options.concurrency ?? 5));
  const results: SettledResult<R>[] = new Array<SettledResult<R>>(items.length);
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
      options.onProgress?.(completed, items.length);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    runOne(),
  );
  await Promise.all(workers);
  return results;
}
