import { Then } from '../../support/steps';

Then('the player count shall be within expected bounds', function () {
  expect(typeof this.result.players).toBe('number');
  expect(this.result.players).toBe(21874);
  expect(this.result.players).toBeGreaterThanOrEqual(0);
  expect(this.result.players).toBeLessThanOrEqual(65000);
});
