import {
  DISTANT_SYSTEM_ID,
  JITA,
  routeFixtures,
  routePaths,
} from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('distant systems', function () {
  queueResponse({
    match: routePaths.route(JITA, DISTANT_SYSTEM_ID),
    body: { route: routeFixtures.longRoute() },
  });
});
