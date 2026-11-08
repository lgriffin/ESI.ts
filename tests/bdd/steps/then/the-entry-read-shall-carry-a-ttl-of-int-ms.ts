import type { CacheEntry } from '../../../../src/core/cache/ICache';
import { Then } from '../../support/steps';

Then('the entry read shall carry a TTL of {int} ms', function (ttl: number) {
  expect((this.result as CacheEntry).ttl).toBe(ttl);
});
