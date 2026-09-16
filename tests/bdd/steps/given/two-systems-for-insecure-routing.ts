import { AMARR, JITA, routeFixtures, routePaths } from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('two systems for insecure routing', function () {
  queueResponse({
    match: routePaths.route(JITA, AMARR),
    body: { route: routeFixtures.insecureRoute() },
  });
});
