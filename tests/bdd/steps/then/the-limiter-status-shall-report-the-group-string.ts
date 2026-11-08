import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter status shall report the group {string}',
  function (group: string) {
    expect(rateLimiterOf(this).getStatus().group).toBe(group);
  },
);
