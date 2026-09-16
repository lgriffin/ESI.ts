import { TIER_NAMES } from '../../support/insurance';
import { Then } from '../../support/steps';

Then('every entry shall contain six named tiers', function () {
  expect(this.result.map((entry: any) => entry.type_id)).toEqual([587, 24690]);
  this.result.forEach((entry: any) => {
    expect(entry.levels).toHaveLength(6);
    expect(entry.levels.map((l: any) => l.name)).toEqual(TIER_NAMES);
  });
});
