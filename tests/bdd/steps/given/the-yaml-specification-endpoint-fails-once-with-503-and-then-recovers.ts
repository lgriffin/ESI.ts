import { YAML_CONTENT_TYPE, metaFixtures, metaPaths } from '../../support/meta';
import { queueError, queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'the YAML specification endpoint fails once with 503 and then recovers',
  function () {
    queueError(503, 'Service Unavailable', { match: metaPaths.yaml });
    queueResponse({
      match: metaPaths.yaml,
      headers: YAML_CONTENT_TYPE,
      body: metaFixtures.yamlSpec(),
    });
  },
);
