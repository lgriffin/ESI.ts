import { buildSeamEsiClient } from '../../support/identity-views';
import { Given } from '../../support/steps';

Given(
  'an EsiClient that holds no token and refreshes through onTokenRefresh',
  function () {
    // A refresh the client's own requests would use; a view must not borrow it.
    buildSeamEsiClient(this, {
      onTokenRefresh: () => Promise.resolve('client-refreshed-token'),
    });
  },
);
