import {
  GOONSWARM_ALLIANCE_ID,
  allianceFixtures,
  allianceMatches,
  alliancePaths,
} from '../../support/alliance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid alliance ID for information gathering', function () {
  queueResponse({
    match: alliancePaths.contacts(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.singleContact(),
  });
  queueResponse({
    match: alliancePaths.corporations(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.memberCorporationIds(),
  });
  queueResponse({
    match: allianceMatches.record(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.tickerRecord(),
  });
});
