import { Then } from '../../support/steps';

Then('the provider shall return an empty list', function () {
  expect(this.result).toEqual([]);
});
