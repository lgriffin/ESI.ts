import { metaPaths } from '../../support/meta';
import { RETRYABLE_ATTEMPTS, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the OpenAPI specification endpoint is unavailable', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Service Unavailable', {
    match: metaPaths.json,
    times: RETRYABLE_ATTEMPTS,
  });
});
