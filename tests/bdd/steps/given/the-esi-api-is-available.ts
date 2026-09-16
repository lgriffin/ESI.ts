import { metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI API is available', function () {
  queueResponse({ match: metaPaths.json, body: metaFixtures.jsonSpec() });
});
