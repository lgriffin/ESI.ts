import type { ApiClient } from '../../../../src/core/ApiClient';
import { markTokenAccepted } from '../../../../src/core/cache/cacheKey';
import { tokenFor } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'ESI accepts tokens for {int} other characters',
  function (count: number) {
    const client = this.values.keyClient as ApiClient;
    for (let i = 1; i <= count; i += 1) {
      markTokenAccepted(client, `Bearer ${tokenFor(91_000_000 + i)}`);
    }
  },
);
