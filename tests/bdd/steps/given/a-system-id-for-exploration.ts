import {
  EXPLORATION,
  universeFixtures,
  universeMatches,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a system ID for exploration', function () {
  queueResponse({
    match: universeMatches.system(EXPLORATION.systemId),
    body: universeFixtures.explorationSystem(),
  });
  queueResponse({
    match: universeMatches.star(EXPLORATION.starId),
    body: universeFixtures.explorationStar(),
  });
  queueResponse({
    match: universeMatches.station(EXPLORATION.stationId),
    body: universeFixtures.explorationStation(),
  });
  queueResponse({
    match: universeMatches.planet(EXPLORATION.planetId),
    body: universeFixtures.explorationPlanet(),
  });
});
