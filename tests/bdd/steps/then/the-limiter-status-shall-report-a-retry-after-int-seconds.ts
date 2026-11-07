import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report a retry after {int} seconds',
  function (seconds: number) {
    expect(rateLimiterOf(this).getStatus().retryAfter).toBe(seconds);
  },
);
