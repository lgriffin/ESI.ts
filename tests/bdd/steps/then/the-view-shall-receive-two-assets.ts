import { Then } from '../../support/steps';

Then('the view shall receive two assets', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toHaveLength(2);
});
