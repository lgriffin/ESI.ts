import { metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the status of its routes', function () {
  queueResponse({
    match: metaPaths.status,
    body: metaFixtures.routeStatus(),
  });
});
