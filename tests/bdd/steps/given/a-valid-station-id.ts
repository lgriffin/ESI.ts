import {
  JITA_STATION_ID,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a valid station ID', function () {
  queueResponse({
    match: universeMatches.station(JITA_STATION_ID),
    body: universeFixtures.jitaStation(),
  });
});
