import { Then } from '../../support/steps';

Then('the client shall identify market patterns', function () {
  expect(this.result.map((d: any) => d.date)).toEqual([
    '2024-01-10',
    '2024-01-11',
    '2024-01-12',
    '2024-01-13',
    '2024-01-14',
  ]);
  expect(this.values.priceChanges.every((change: number) => change > 0)).toBe(
    true,
  );
  expect(this.result[4].average - this.result[0].average).toBeCloseTo(0.4, 2);
});
