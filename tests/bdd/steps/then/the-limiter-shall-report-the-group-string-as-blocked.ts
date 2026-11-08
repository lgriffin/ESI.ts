import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter shall report the group {string} as blocked',
  function (group: string) {
    expect(rateLimiterOf(this).isBlocked(group)).toBe(true);
  },
);
