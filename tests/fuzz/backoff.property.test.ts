/**
 * Retry backoff: properties of `retryDelay`.
 *
 * guides/ARCHITECTURE.md documents the delay as
 * `baseDelayMs × 2^attempt × jitter(0.75–1.25)`, capped at `maxDelayMs`.
 * For any attempt count, any non-negative base and cap, and any value of the
 * jitter source in [0, 1):
 *
 *   - the delay is a finite number in [0, maxDelayMs];
 *   - with the jitter source fixed, the delay never decreases as the attempt
 *     number grows (monotonic before jitter);
 *   - with independent jitter draws, a later attempt never waits less than an
 *     earlier one, because the lowest jitter of attempt n+1 (1.5× of attempt
 *     n's base) is above the highest jitter of attempt n (1.25×);
 *   - below the cap, the delay stays inside the documented jitter window.
 *
 * The jitter source is `Math.random`, stubbed per call with the generated value.
 */
import * as fc from 'fast-check';

import { retryDelay } from '../../src/core/util/retry';
import { describeProperty, invariant } from './support/property';

type RetryDelay = (attempt: number, baseMs: number, maxMs: number) => number;

/** Delay for `attempt` with the jitter source returning `r`. */
function delayWith(
  subject: RetryDelay,
  r: number,
  attempt: number,
  base: number,
  max: number,
): number {
  const spy = jest.spyOn(Math, 'random').mockReturnValue(r);
  try {
    return subject(attempt, base, max);
  } finally {
    spy.mockRestore();
  }
}

/** Small counts, counts around the 2^1024 overflow, and anything up to 5000. */
const attemptArb = fc.oneof(
  fc.integer({ min: 0, max: 40 }),
  fc.integer({ min: 1015, max: 1080 }),
  fc.integer({ min: 0, max: 5000 }),
);
/** Jitter source values, including both ends of [0, 1). */
const jitterArb = fc.oneof(
  fc.constantFrom(0, 0.5, 1 - Number.EPSILON),
  fc.double({ min: 0, max: 1, maxExcluded: true, noNaN: true }),
);
const baseArb = fc.oneof(
  fc.constantFrom(0, 1, 1000),
  fc.double({ min: 0, max: 1e6, noNaN: true }),
);
const maxArb = fc.oneof(
  fc.constantFrom(0, 2, 30_000),
  fc.double({ min: 0, max: 1e9, noNaN: true }),
);

function backoffProperty(subject: RetryDelay) {
  return fc.property(
    attemptArb,
    fc.integer({ min: 1, max: 64 }),
    jitterArb,
    jitterArb,
    baseArb,
    maxArb,
    (attempt, step, r1, r2, base, max) => {
      const later = attempt + step;
      const d1 = delayWith(subject, r1, attempt, base, max);
      const d1Later = delayWith(subject, r1, later, base, max);
      const d2Later = delayWith(subject, r2, later, base, max);
      const ctx = `attempt=${attempt}, later=${later}, base=${base}, max=${max}, jitter=${r1} then ${r2}; delays ${d1}, ${d1Later}, ${d2Later}`;

      for (const d of [d1, d1Later, d2Later]) {
        invariant(Number.isFinite(d), `delay ${d} is not finite (${ctx})`);
        invariant(d >= 0, `delay ${d} is negative (${ctx})`);
        invariant(d <= max, `delay ${d} exceeds maxDelayMs (${ctx})`);
      }
      invariant(
        d1Later >= d1,
        `with the jitter source fixed, attempt ${later} waits less than attempt ${attempt} (${ctx})`,
      );
      invariant(
        d2Later >= d1,
        `attempt ${later} waits less than attempt ${attempt} across jitter draws (${ctx})`,
      );

      const exponential = base * Math.pow(2, attempt);
      if (
        exponential > 1e-300 &&
        Number.isFinite(exponential) &&
        exponential * 1.25 < max
      ) {
        const tolerance = 1e-9;
        invariant(
          d1 >= exponential * 0.75 * (1 - tolerance) &&
            d1 <= exponential * 1.25 * (1 + tolerance),
          `delay ${d1} is outside the 0.75–1.25× jitter window of ${exponential} (${ctx})`,
        );
      }
    },
  );
}

/** retryDelay as it was before the overflow fix: base 0 × 2^1024 is NaN. */
const unguardedOverflow: RetryDelay = (attempt, base, max) => {
  const exponential = base * Math.pow(2, attempt);
  const jitter = exponential * (0.75 + Math.random() * 0.5);
  return Math.min(jitter, max);
};

describeProperty<RetryDelay>({
  name: 'retry backoff is bounded, non-negative and monotonic in attempt',
  file: __filename,
  subject: () => retryDelay,
  mutants: {
    'no cap at maxDelayMs': () => (attempt, base) =>
      base * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5),
    'full jitter (0–1×) breaks monotonicity': () => (attempt, base, max) =>
      Math.min(base * Math.pow(2, attempt) * Math.random(), max),
    'linear growth leaves the jitter window': () => (attempt, base, max) =>
      Math.min(base * (attempt + 1) * (0.75 + Math.random() * 0.5), max),
    'jitter can go negative': () => (attempt, base, max) =>
      Math.min(base * Math.pow(2, attempt) * (Math.random() - 0.25), max),
    'overflow: base 0 × 2^1024 is NaN': () => unguardedOverflow,
  },
  property: backoffProperty,
});
