import { Then } from '../../support/steps';

Then('the cache statistics shall be null', function () {
  expect(this.result).toBeNull();
});
