import { statsOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then('the cache shall report no oldest and no newest entry', function () {
  const stats = statsOf(this);
  expect([stats.oldestEntry, stats.newestEntry]).toEqual([null, null]);
});
