import { paragonHubPaths } from '../../support/paragon-hub';
import { RETRYABLE_ATTEMPTS, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI service is down', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Service Unavailable', {
    match: paragonHubPaths.publicListings,
    times: RETRYABLE_ATTEMPTS,
  });
});
