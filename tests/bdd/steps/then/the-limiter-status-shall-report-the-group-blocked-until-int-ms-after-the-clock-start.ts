import { LIMITER_CLOCK_START, rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report the group blocked until {int} ms after the clock start',
  function (ms: number) {
    expect(rateLimiterOf(this).getStatus().blockedUntil).toBe(
      LIMITER_CLOCK_START + ms,
    );
  },
);
