import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter shall report the group {string} blocked until {int}',
  function (group: string, until: number) {
    expect(rateLimiterOf(this).getGroupStatus(group)?.blockedUntil).toBe(until);
  },
);
