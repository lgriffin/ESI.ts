/**
 * The real clock: the one module in src/ allowed to read the wall clock and
 * start timers (npm run lint:determinism). Code that needs time takes a
 * `Clock` and defaults to this one.
 */
import type { Clock } from './ports/Clock';

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
