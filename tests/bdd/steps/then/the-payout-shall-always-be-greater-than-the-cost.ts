import { Then } from '../../support/steps';

Then('the payout shall always be greater than the cost', function () {
  expect(this.result).toHaveLength(1);
  expect(this.result[0].type_id).toBe(17918);
  expect(this.result[0].levels).toHaveLength(6);
  this.result.forEach((ship: any) => {
    ship.levels.forEach((level: any) => {
      expect(level.payout).toBeGreaterThan(level.cost);
    });
  });
});
