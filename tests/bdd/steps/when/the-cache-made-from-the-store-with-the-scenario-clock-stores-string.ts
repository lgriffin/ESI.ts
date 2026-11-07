import { cacheClock } from '../../support/cache-components';
import { cacheFromStore } from '../../../../src/core/cache/CacheStoreCache';
import type { CacheStore } from '../../../../src/core/ports/CacheStore';
import { When } from '../../support/steps';

When(
  'the cache made from the store with the scenario clock stores {string}',
  function (url: string) {
    const clock = cacheClock();
    this.values.cacheClock = clock;
    const cache = cacheFromStore(this.values.store as CacheStore, clock);
    cache.set(url, 'e1', { url }, {});
    this.values.cache = cache;
  },
);
