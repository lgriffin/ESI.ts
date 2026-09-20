import { GOONSWARM_ALLIANCE_ID, alliancePaths } from '../../support/alliance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an alliance with no contacts', function () {
  queueResponse({
    match: alliancePaths.contacts(GOONSWARM_ALLIANCE_ID),
    body: [],
  });
});
