import { YAML_CONTENT_TYPE, metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the ESI API is available for YAML', function () {
  queueResponse({
    match: metaPaths.yaml,
    headers: YAML_CONTENT_TYPE,
    body: metaFixtures.yamlSpec(),
  });
});
