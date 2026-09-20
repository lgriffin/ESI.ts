import { INSURANCE_PRICES_PATH } from '../../support/insurance';
import { RETRYABLE_ATTEMPTS, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI service is temporarily unavailable', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Service Unavailable', {
    match: INSURANCE_PRICES_PATH,
    times: RETRYABLE_ATTEMPTS,
  });
});
