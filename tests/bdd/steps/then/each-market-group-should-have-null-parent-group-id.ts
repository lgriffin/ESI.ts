import { type MarketGroup } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then('each market group should have null parent group ID', function () {
  const groups: MarketGroup[] = this.result;
  expect(groups.length).toBeGreaterThanOrEqual(1);
  for (const group of groups) {
    expect(group.parentGroupId).toBeNull();
  }
});
