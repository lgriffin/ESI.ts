import { metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI publishes a changelog with one entry', function () {
  queueResponse({
    match: metaPaths.changelog,
    body: metaFixtures.changelog(),
  });
});
