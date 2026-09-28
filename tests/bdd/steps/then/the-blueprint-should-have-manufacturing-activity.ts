import { Then } from '../../support/steps';

Then('the blueprint should have manufacturing activity', function () {
  expect(this.result).not.toBeNull();
  expect(this.result.activities.manufacturing).toBeDefined();
});
