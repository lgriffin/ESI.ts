import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the built client shall have a rate limiter', function () {
  expect(apiClientOf(this).getRateLimiter()).not.toBeNull();
});
