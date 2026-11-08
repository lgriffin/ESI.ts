import { statsOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then('the cache hit rate shall be {float}', function (rate: number) {
  expect(statsOf(this).hitRate).toBe(rate);
});
