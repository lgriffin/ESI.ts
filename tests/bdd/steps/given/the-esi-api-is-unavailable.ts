import { STATUS_PATH } from '../../support/status';
import { RETRYABLE_ATTEMPTS, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI API is unavailable', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Service Unavailable', {
    match: STATUS_PATH,
    times: RETRYABLE_ATTEMPTS,
  });
});
