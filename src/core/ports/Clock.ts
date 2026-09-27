/**
 * Time, as the pipeline sees it: rate-limit windows, cache expiry and retry
 * back-off read and wait through this port, so a test can drive them with a
 * fake clock instead of real timers. `systemClock` in src/core/clock.ts is the
 * real one.
 */
export interface Clock {
  /** Milliseconds since the epoch. */
  now(): number;
  /** Resolves after `ms` milliseconds. */
  sleep(ms: number): Promise<void>;
}
