import { parseHeaders, rateLimiterOf } from '../../support/rate-limiter';
import { When } from '../../support/steps';

When('the limiter reads the headers {string}', function (headers: string) {
  rateLimiterOf(this).updateRateLimitInfo(parseHeaders(headers));
});
