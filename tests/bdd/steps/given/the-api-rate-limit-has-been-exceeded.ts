import { INSURANCE_PRICES_PATH } from '../../support/insurance';
import {
  SEAM_RETRY,
  createSeamClient,
  queueError,
} from '../../support/transport';
import { Given } from '../../support/steps';

Given('the API rate limit has been exceeded', function () {
  // A 429 blocks the rate-limit group for at least 60 seconds, so a
  // retrying client would sleep through the block before its next
  // attempt. This caller does not retry, which surfaces the rejection
  // on the single 429 exchange.
  this.client = createSeamClient({
    retryConfig: { ...SEAM_RETRY, maxRetries: 0 },
  });
  queueError(429, 'Too many errors', {
    match: INSURANCE_PRICES_PATH,
    headers: { 'x-esi-error-limit-remain': '0' },
  });
});
