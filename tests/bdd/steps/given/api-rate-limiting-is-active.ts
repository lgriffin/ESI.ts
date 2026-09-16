import { GOONSWARM_ALLIANCE_ID, allianceMatches } from '../../support/alliance';
import {
  SEAM_RETRY,
  createSeamClient,
  queueError,
} from '../../support/transport';
import { Given } from '../../support/steps';

Given('API rate limiting is active', function () {
  // A 429 blocks the rate-limit group for 60s before any retry, so this
  // client surfaces the first 429 instead of waiting out the block.
  this.client = createSeamClient({
    retryConfig: { ...SEAM_RETRY, maxRetries: 0 },
  });
  queueError(429, 'Too many requests', {
    match: allianceMatches.record(GOONSWARM_ALLIANCE_ID),
  });
});
