import { Then } from '../../support/steps';

Then('the VIP flag should be true and player count shall be low', function () {
  expect(this.result.vip).toBe(true);
  expect(this.result.players).toBe(50);
});
