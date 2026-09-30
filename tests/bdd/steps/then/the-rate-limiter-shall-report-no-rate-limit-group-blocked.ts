import { limiterOf } from '../../support/rate-limit';
import { Then } from '../../support/steps';

Then('the rate limiter shall report no rate-limit group blocked', function () {
  const limiter = limiterOf(this);
  expect(limiter.isBlocked()).toBe(false);
  expect(limiter.isBlocked('status')).toBe(false);
  expect(limiter.isBlocked('no-such-group')).toBe(false);
});
