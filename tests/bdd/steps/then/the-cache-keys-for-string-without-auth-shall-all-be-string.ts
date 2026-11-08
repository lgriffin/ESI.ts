import type { ApiClient } from '../../../../src/core/ApiClient';
import {
  buildCacheKey,
  buildConditionalCacheKey,
  buildDedupeKey,
} from '../../../../src/core/cache/cacheKey';
import { Then } from '../../support/steps';

Then(
  'the cache keys for {string} without auth shall all be {string}',
  function (url: string, key: string) {
    const client = this.values.keyClient as ApiClient;
    expect([
      buildCacheKey(url, client),
      buildConditionalCacheKey(url, client),
      buildDedupeKey(url, client),
    ]).toEqual([key, key, key]);
  },
);
