import {
  GOONSWARM_ALLIANCE_ID,
  allianceFixtures,
  allianceMatches,
} from '../../support/alliance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid alliance ID', function () {
  queueResponse({
    match: allianceMatches.record(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.goonswarmRecord(),
  });
});
