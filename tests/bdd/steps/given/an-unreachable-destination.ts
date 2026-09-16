import { JITA, UNREACHABLE_SYSTEM_ID, routePaths } from '../../support/route';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unreachable destination', function () {
  queueError(404, 'No route found', {
    match: routePaths.route(JITA, UNREACHABLE_SYSTEM_ID),
  });
});
