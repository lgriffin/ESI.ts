import { metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI serves its specification in JSON form', function () {
  queueResponse({ match: metaPaths.json, body: metaFixtures.jsonSpec() });
});
