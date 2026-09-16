/**
 * Time an async operation with the monotonic high-resolution clock.
 *
 * `performance.now()` rather than `Date.now()`: wall-clock time can step
 * backwards or jump under NTP adjustment, and its millisecond resolution is
 * too coarse for the per-call overhead margins the performance Rules assert.
 */
export async function timeExecution<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; elapsed: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, elapsed: performance.now() - start };
}
