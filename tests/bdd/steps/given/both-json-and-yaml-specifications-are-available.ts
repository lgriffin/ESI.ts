import { YAML_CONTENT_TYPE, metaFixtures, metaPaths } from '../../support/meta';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('both JSON and YAML specifications are available', function () {
  queueResponse({
    match: metaPaths.json,
    body: metaFixtures.alliancesJsonSpec(),
  });
  queueResponse({
    match: metaPaths.yaml,
    headers: YAML_CONTENT_TYPE,
    body: metaFixtures.alliancesYamlSpec(),
  });
});
