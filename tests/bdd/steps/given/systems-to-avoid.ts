import { AMARR, JITA, routeFixtures, routePaths } from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('systems to avoid', function () {
  queueResponse({
    match: routePaths.route(JITA, AMARR),
    body: { route: routeFixtures.routeAvoidingSystems() },
  });
});
