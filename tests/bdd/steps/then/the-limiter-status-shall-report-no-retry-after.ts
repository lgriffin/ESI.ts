import { rateLimiterOf } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then('the limiter status shall report no retry after', function () {
  expect(rateLimiterOf(this).getStatus().retryAfter).toBeNull();
});
