import { Then } from '../../support/steps';

Then('the station should have an owner', function () {
  expect(this.result).not.toBeNull();
  expect(this.result.ownerId).toBeGreaterThan(0);
});
