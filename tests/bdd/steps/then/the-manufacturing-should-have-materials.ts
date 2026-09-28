import { Then } from '../../support/steps';

Then('the manufacturing should have materials', function () {
  const manufacturing = this.result.activities.manufacturing;
  expect(manufacturing).toBeDefined();
  expect(manufacturing.materials.length).toBeGreaterThanOrEqual(1);
});
