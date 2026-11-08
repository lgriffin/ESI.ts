import { CACHE_CLOCK_START, statsOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the newest cache entry shall be {int} ms after the clock start',
  function (ms: number) {
    expect(statsOf(this).newestEntry).toBe(CACHE_CLOCK_START + ms);
  },
);
