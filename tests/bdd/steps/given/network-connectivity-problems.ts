import {
  GOONSWARM_ALLIANCE_ID,
  STALLED_DELAY_MS,
  STALLED_TIMEOUT_MS,
  allianceFixtures,
  allianceMatches,
} from '../../support/alliance';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  queueResponse,
} from '../../support/transport';
import { Given } from '../../support/steps';

Given('network connectivity problems', function () {
  // The connection stalls past the client timeout on every attempt, so
  // no HTTP status ever reaches the client.
  this.client = createSeamClient({ timeout: STALLED_TIMEOUT_MS });
  queueResponse({
    match: allianceMatches.record(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.record(),
    delayMs: STALLED_DELAY_MS,
    times: RETRYABLE_ATTEMPTS,
  });
});
