import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter shall report the group {string} with {int} of {int} tokens left and {int} used',
  function (group: string, remaining: number, limit: number, used: number) {
    const status = rateLimiterOf(this).getGroupStatus(group);
    expect(status && [status.remaining, status.limit, status.used]).toEqual([
      remaining,
      limit,
      used,
    ]);
  },
);
