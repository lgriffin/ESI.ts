import { MUTUAL_WAR_ID, warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a mutual war exists', function () {
  queueResponse({
    match: warMatches.war(MUTUAL_WAR_ID),
    body: warFixtures.mutualWar(),
  });
});
