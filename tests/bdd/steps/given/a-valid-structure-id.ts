import {
  CITADEL_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid structure ID', function () {
  queueResponse({
    match: universeMatches.structure(CITADEL_ID),
    body: universeFixtures.citadel(),
  });
});
