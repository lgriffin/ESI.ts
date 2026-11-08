import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then('the limiter shall report itself as not blocked', function () {
  expect(rateLimiterOf(this).isBlocked()).toBe(false);
});
