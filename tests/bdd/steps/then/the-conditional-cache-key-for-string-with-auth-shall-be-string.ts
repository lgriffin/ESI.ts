import type { ApiClient } from '../../../../src/core/ApiClient';
import { buildConditionalCacheKey } from '../../../../src/core/cache/cacheKey';
import { Then } from '../../support/steps';

Then(
  'the conditional cache key for {string} with auth shall be {string}',
  function (url: string, key: string) {
    const client = this.values.keyClient as ApiClient;
    expect(buildConditionalCacheKey(url, client, true)).toBe(key);
  },
);
