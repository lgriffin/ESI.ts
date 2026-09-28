import { Then } from '../../support/steps';

Then('the star should have a type ID', function () {
  expect(this.result).not.toBeNull();
  expect(this.result.typeId).toBeGreaterThan(0);
});
