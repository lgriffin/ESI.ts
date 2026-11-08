import { cacheFromStore } from '../../../../src/core/cache/CacheStoreCache';
import type { CacheStore } from '../../../../src/core/ports/CacheStore';
import { Then } from '../../support/steps';

Then('the cache made from the store shall be the store itself', function () {
  const store = this.values.store as CacheStore;
  expect(cacheFromStore(store)).toBe(store);
});
