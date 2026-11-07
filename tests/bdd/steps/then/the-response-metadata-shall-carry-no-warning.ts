import { Then } from '../../support/steps';

Then('the response metadata shall carry no warning', function () {
  expect(this.error).toBeUndefined();
  expect(this.result.meta.warning).toBeUndefined();
});
