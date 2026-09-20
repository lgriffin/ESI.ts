import {
  JITA_STAR_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid star ID', function () {
  queueResponse({
    match: universeMatches.star(JITA_STAR_ID),
    body: universeFixtures.jitaStar(),
  });
});
