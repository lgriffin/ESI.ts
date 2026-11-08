import type { CacheEntry } from '../../../../src/core/cache/ICache';
import { Then } from '../../support/steps';

Then(
  'the entry read shall carry the header {string} {string}',
  function (name: string, value: string) {
    expect((this.result as CacheEntry).headers).toEqual({ [name]: value });
  },
);
