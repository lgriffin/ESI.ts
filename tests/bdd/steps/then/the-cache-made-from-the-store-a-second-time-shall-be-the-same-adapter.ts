import { cacheFromStore } from '../../../../src/core/cache/CacheStoreCache';
import type { CacheStore } from '../../../../src/core/ports/CacheStore';
import { Then } from '../../support/steps';

Then(
  'the cache made from the store a second time shall be the same adapter',
  function () {
    const store = this.values.store as CacheStore;
    expect(this.values.adapter).toBeDefined();
    expect(cacheFromStore(store)).toBe(this.values.adapter);
  },
);
