import { JITA, routePaths } from '../../support/route';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the same origin and destination', function () {
  queueResponse({
    match: routePaths.route(JITA, JITA),
    body: { route: [JITA] },
  });
});
