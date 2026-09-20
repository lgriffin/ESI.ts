import {
  GOONSWARM_ALLIANCE_ID,
  LATENCY_DELAY_MS,
  allianceFixtures,
  allianceMatches,
} from '../../support/alliance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('normal API conditions', function () {
  queueResponse({
    match: allianceMatches.record(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.latencyRecord(),
    delayMs: LATENCY_DELAY_MS,
  });
});
