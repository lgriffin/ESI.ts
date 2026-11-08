import { CACHE_CLOCK_START } from '../../support/cache-components';
import type { CacheEntry } from '../../../../src/core/cache/ICache';
import { Then } from '../../support/steps';

Then(
  'the entry read shall be stamped {int} ms after the clock start',
  function (ms: number) {
    expect((this.result as CacheEntry).timestamp).toBe(CACHE_CLOCK_START + ms);
  },
);
