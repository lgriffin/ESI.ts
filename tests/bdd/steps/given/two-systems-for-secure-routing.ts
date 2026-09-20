import { AMARR, JITA, routeFixtures, routePaths } from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('two systems for secure routing', function () {
  queueResponse({
    match: routePaths.route(JITA, AMARR),
    body: { route: routeFixtures.secureRoute() },
  });
});
