import { metaFixtures } from '../../support/meta';
import { Then } from '../../support/steps';

Then('the view shall receive the YAML specification as text', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe(metaFixtures.yamlSpec());
});
