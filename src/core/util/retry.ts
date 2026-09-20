export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryMutations?: boolean;
}

export function retryDelay(
  attempt: number,
  baseMs: number,
  maxMs: number,
): number {
  // 2^attempt overflows to Infinity from attempt 1024, and 0 × Infinity is NaN.
  const exponential = baseMs === 0 ? 0 : baseMs * Math.pow(2, attempt);
  // eslint-disable-next-line sonarjs/pseudo-random
  const jitter = exponential * (0.75 + Math.random() * 0.5);
  return Math.min(jitter, maxMs);
}
