import type { ApiClient } from '../../../../src/core/ApiClient';
import { markTokenAccepted } from '../../../../src/core/cache/cacheKey';
import { tokenFor } from '../../support/cache-components';
import { When } from '../../support/steps';

When('ESI accepts a token for one more character', function () {
  const client = this.values.keyClient as ApiClient;
  markTokenAccepted(client, `Bearer ${tokenFor(92_000_000)}`);
});
