import { Then } from '../../support/steps';

Then('the type is returned', function () {
  expect(this.result).toBeDefined();
});
