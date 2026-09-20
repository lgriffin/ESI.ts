import { SKINR_CHARACTER_ID, cosmeticsPaths } from '../../support/cosmetics';
import { RETRYABLE_ATTEMPTS, queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the SKINR service is down', function () {
  // 503 is retryable, so the outage has to outlast the retry budget.
  queueError(503, 'Service Unavailable', {
    match: cosmeticsPaths.characterSkinr(SKINR_CHARACTER_ID),
    times: RETRYABLE_ATTEMPTS,
  });
});
