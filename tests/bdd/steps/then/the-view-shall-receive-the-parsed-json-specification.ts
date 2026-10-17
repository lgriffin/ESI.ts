import { metaFixtures } from '../../support/meta';
import { Then } from '../../support/steps';

Then('the view shall receive the parsed JSON specification', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toEqual(metaFixtures.jsonSpec());
});
