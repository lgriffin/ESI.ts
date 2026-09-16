import {
  JITA,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid solar system ID', function () {
  queueResponse({
    match: universeMatches.system(JITA),
    body: universeFixtures.jita(),
  });
});
