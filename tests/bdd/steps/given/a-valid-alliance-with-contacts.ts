import {
  GOONSWARM_ALLIANCE_ID,
  allianceFixtures,
  alliancePaths,
} from '../../support/alliance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid alliance with contacts', function () {
  queueResponse({
    match: alliancePaths.contacts(GOONSWARM_ALLIANCE_ID),
    body: allianceFixtures.characterAndCorporationContacts(),
  });
});
