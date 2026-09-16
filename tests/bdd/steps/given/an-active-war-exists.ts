import { ACTIVE_WAR_ID, warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an active war exists', function () {
  queueResponse({
    match: warMatches.war(ACTIVE_WAR_ID),
    body: warFixtures.activeWar(),
  });
});
