import {
  JITA_IV_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid planet ID', function () {
  queueResponse({
    match: universeMatches.planet(JITA_IV_ID),
    body: universeFixtures.jitaIV(),
  });
});
