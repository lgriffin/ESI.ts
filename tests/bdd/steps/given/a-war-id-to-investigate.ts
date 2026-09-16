import { ACTIVE_WAR_ID, warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a war ID to investigate', function () {
  queueResponse({
    match: warMatches.war(ACTIVE_WAR_ID),
    body: warFixtures.activeWar(),
  });
  queueResponse({
    match: warMatches.killmails(ACTIVE_WAR_ID),
    body: warFixtures.twoKillmails(),
  });
});
