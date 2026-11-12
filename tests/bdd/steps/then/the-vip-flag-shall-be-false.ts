import { Then } from '../../support/steps';

Then('the VIP flag shall be false', function () {
  expect(this.result.vip).toBe(false);
  expect(this.result.players).toBe(32000);
});
