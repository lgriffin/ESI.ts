import { Then } from '../../support/steps';

Then('the manufacturing time should be {int}', function (seconds: number) {
  expect(this.result.activities.manufacturing.time).toBe(seconds);
});
