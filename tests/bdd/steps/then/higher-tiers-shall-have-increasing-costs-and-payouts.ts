import { Then } from '../../support/steps';

Then('higher tiers shall have increasing costs and payouts', function () {
  const levels = this.result;
  expect(levels.map((l: any) => l.cost)).toEqual([
    500000, 1250000, 2500000, 5000000, 10000000, 20000000,
  ]);
  expect(levels.map((l: any) => l.payout)).toEqual([
    1000000, 2500000, 5000000, 10000000, 20000000, 40000000,
  ]);
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i].cost).toBeGreaterThan(levels[i - 1].cost);
    expect(levels[i].payout).toBeGreaterThan(levels[i - 1].payout);
  }
});
