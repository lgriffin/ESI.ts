import { AMARR, JITA, routeFixtures, routePaths } from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('two solar system IDs', function () {
  queueResponse({
    match: routePaths.route(JITA, AMARR),
    body: { route: routeFixtures.shortestRoute() },
  });
});
