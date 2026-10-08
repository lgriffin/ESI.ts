/**
 * The SDE's real clock. The SDE shares no code with the pipeline (CHARTER
 * ARCH-10, `npm run lint:layers`), so it cannot take `systemClock` from
 * `src/core/clock.ts`; it implements the same `Clock` port itself, and this
 * is the one module under `src/sde` allowed to read the wall clock
 * (`npm run lint:determinism`). Code that needs time takes a `Clock` and
 * defaults to this one.
 */
import type { Clock } from '../core/ports/Clock';

export const systemClock: Clock = {
  now: () => Date.now(),
  // Stryker disable next-line ArrowFunction: no SDE code sleeps; the Clock port requires the member, and the unit suite covers it.
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
