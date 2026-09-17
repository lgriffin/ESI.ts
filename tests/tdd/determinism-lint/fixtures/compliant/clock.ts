// The clock module itself: every restricted construct, allowed only at the
// clock module's path (src/core/clock.ts).
import { setTimeout as delay } from 'timers/promises';

export const systemClock = {
  now: () => Date.now(),
  date: () => new Date(),
  dateString: () => Date(),
  monotonic: () => performance.now(),
  hrtime: () => process.hrtime.bigint(),
  random: () => Math.random(),
  sleep: (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  every: (ms: number, fn: () => void) => setInterval(fn, ms),
  immediate: (fn: () => void) => setImmediate(fn),
  microtask: (fn: () => void) => queueMicrotask(fn),
  global: (fn: () => void) => globalThis.setTimeout(fn, 0),
  delay,
};
