import { warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('wars exist in the system', function () {
  queueResponse({ match: warMatches.list(), body: warFixtures.warIds() });
});
