import { universeFixtures, universeMatches } from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the universe data is available for groups', function () {
  queueResponse({
    match: universeMatches.groups(),
    body: universeFixtures.groupIndex(),
  });
});
