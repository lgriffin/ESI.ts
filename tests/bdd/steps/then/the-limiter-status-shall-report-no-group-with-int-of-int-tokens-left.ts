import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report no group with {int} of {int} tokens left',
  function (remaining: number, limit: number) {
    const status = rateLimiterOf(this).getStatus();
    expect([status.group, status.remaining, status.limit]).toEqual([
      null,
      remaining,
      limit,
    ]);
  },
);
