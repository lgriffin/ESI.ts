import type { ApiClient } from '../../../../src/core/ApiClient';
import { markTokenAccepted } from '../../../../src/core/cache/cacheKey';
import { Given } from '../../support/steps';

Given("ESI accepts the client's token", function () {
  const client = this.values.keyClient as ApiClient;
  markTokenAccepted(client, client.getAuthorizationHeader() ?? '');
});
