import { FINISHED_WAR_ID, warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a finished war exists', function () {
  queueResponse({
    match: warMatches.war(FINISHED_WAR_ID),
    body: warFixtures.finishedWar(),
  });
});
