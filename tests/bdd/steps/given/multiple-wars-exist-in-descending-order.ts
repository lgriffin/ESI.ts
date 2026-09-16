import { warFixtures, warMatches } from '../../support/wars';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('multiple wars exist in descending order', function () {
  queueResponse({
    match: warMatches.list(),
    body: warFixtures.descendingWarIds(),
  });
});
