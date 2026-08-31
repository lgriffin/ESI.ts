export async function timeExecution<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; elapsed: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, elapsed: Date.now() - start };
}

export function expectFasterThan(elapsed: number, maxMs: number): void {
  expect(elapsed).toBeLessThan(maxMs);
}
