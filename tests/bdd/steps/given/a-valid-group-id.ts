import {
  MINERAL_GROUP_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid group ID', function () {
  queueResponse({
    match: universeMatches.group(MINERAL_GROUP_ID),
    body: universeFixtures.mineralGroup(),
  });
});
