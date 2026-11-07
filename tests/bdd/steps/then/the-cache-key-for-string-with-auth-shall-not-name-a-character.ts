import type { ApiClient } from '../../../../src/core/ApiClient';
import { buildCacheKey } from '../../../../src/core/cache/cacheKey';
import { Then } from '../../support/steps';

Then(
  'the cache key for {string} with auth shall not name a character',
  function (url: string) {
    const client = this.values.keyClient as ApiClient;
    expect(buildCacheKey(url, client, true)).toMatch(
      new RegExp(`^[0-9a-f]{16}:${url}$`),
    );
  },
);
