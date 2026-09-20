import { ACTIVE_WAR_ID, warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a war with killmails exists', function () {
  queueResponse({
    match: warMatches.killmails(ACTIVE_WAR_ID),
    body: warFixtures.threeKillmails(),
  });
});
