import { Then } from '../../support/steps';

Then('the provider shall return null', function () {
  expect(this.result).toBeNull();
});
