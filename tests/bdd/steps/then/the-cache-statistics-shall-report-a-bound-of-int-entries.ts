import { statsOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache statistics shall report a bound of {int} entries',
  function (maxEntries: number) {
    expect(statsOf(this).maxEntries).toBe(maxEntries);
  },
);
