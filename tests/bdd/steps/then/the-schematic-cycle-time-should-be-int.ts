import { Then } from '../../support/steps';

Then('the schematic cycle time should be {int}', function (seconds: number) {
  expect(this.result.cycleTime).toBe(seconds);
});
