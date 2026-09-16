import { universeFixtures, universeMatches } from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a list of entity IDs', function () {
  queueResponse({
    match: universeMatches.names(),
    body: universeFixtures.entityNames(),
  });
});
