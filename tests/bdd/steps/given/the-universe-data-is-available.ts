import { universeFixtures, universeMatches } from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the universe data is available', function () {
  queueResponse({
    match: universeMatches.systems(),
    body: universeFixtures.systemIndex(),
  });
});
