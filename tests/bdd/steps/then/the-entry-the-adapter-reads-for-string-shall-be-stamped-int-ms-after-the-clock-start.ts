import { CACHE_CLOCK_START, cacheOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the entry the adapter reads for {string} shall be stamped {int} ms after the clock start',
  function (url: string, ms: number) {
    expect(cacheOf(this).get(url)?.timestamp).toBe(CACHE_CLOCK_START + ms);
  },
);
