import { etagCacheOf } from '../../support/cache-components';
import { cacheFromStore } from '../../../../src/core/cache/CacheStoreCache';
import { Then } from '../../support/steps';

Then(
  'the cache made from the ETag cache shall be the ETag cache itself',
  function () {
    const cache = etagCacheOf(this);
    expect(cacheFromStore(cache)).toBe(cache);
  },
);
