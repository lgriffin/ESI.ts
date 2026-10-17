import { metaFixtures, metaPaths, YAML_CONTENT_TYPE } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI serves its specification in YAML form', function () {
  queueResponse({
    match: metaPaths.yaml,
    body: metaFixtures.yamlSpec(),
    headers: YAML_CONTENT_TYPE,
  });
});
