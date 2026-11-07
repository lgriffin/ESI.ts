import { lastWaits } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then("the limiter's waits shall be {string}", function (waits: string) {
  expect(this.error).toBeUndefined();
  expect(lastWaits(this)).toBe(waits);
});
