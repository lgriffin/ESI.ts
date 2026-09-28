import { Then } from '../../support/steps';

Then('the station should have reprocessing efficiency', function () {
  expect(this.result.reprocessingEfficiency).toBeGreaterThan(0);
});
