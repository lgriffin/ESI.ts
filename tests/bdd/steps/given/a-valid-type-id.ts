import {
  TRITANIUM_TYPE_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid type ID', function () {
  queueResponse({
    match: universeMatches.type(TRITANIUM_TYPE_ID),
    body: universeFixtures.tritanium(),
  });
});
