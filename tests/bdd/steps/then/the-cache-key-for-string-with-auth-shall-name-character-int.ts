import type { ApiClient } from '../../../../src/core/ApiClient';
import { buildCacheKey } from '../../../../src/core/cache/cacheKey';
import { Then } from '../../support/steps';

Then(
  'the cache key for {string} with auth shall name character {int}',
  function (url: string, characterId: number) {
    const client = this.values.keyClient as ApiClient;
    expect(buildCacheKey(url, client, true)).toBe(
      `character:${characterId}:${url}`,
    );
  },
);
