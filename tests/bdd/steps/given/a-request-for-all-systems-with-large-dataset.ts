import { universeFixtures, universeMatches } from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a request for all systems with large dataset', function () {
  queueResponse({
    match: universeMatches.systems(),
    body: universeFixtures.largeSystemIndex(),
  });
});
