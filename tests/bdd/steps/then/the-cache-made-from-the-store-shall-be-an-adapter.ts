import {
  CacheStoreCache,
  cacheFromStore,
} from '../../../../src/core/cache/CacheStoreCache';
import type { CacheStore } from '../../../../src/core/ports/CacheStore';
import { Then } from '../../support/steps';

Then('the cache made from the store shall be an adapter', function () {
  const store = this.values.store as CacheStore;
  const cache = cacheFromStore(store);
  expect(cache).toBeInstanceOf(CacheStoreCache);
  this.values.adapter = cache;
});
