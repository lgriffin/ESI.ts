import type { CacheEntry } from '../../../../src/core/cache/ICache';
import { Then } from '../../support/steps';

Then('the entry read shall carry no TTL', function () {
  expect(this.result).not.toBeNull();
  expect('ttl' in (this.result as CacheEntry)).toBe(false);
});
