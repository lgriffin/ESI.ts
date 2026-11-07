import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report the group blocked until {int} ms',
  function (epochMs: number) {
    expect(rateLimiterOf(this).getStatus().blockedUntil).toBe(epochMs);
  },
);
