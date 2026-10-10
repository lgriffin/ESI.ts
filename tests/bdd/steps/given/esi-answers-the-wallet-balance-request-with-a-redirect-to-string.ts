import { queueWalletRedirect } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given(
  'ESI answers the wallet balance request with a redirect to {string}',
  function (location: string) {
    queueWalletRedirect(location);
  },
);
