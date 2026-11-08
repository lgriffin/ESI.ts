import { rateLimiterOf } from '../../support/rate-limiter';
import { Given } from '../../support/steps';

Given('the limiter is in test mode', function () {
  rateLimiterOf(this).setTestMode(true);
});
