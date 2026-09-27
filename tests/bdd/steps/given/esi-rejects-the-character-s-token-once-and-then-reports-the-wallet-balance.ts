import { queueWalletBalance, WALLET_PATH } from '../../support/shared-runtime';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  "ESI rejects the character's token once and then reports the wallet balance",
  function () {
    queueError(401, 'token is expired', { match: WALLET_PATH });
    queueWalletBalance();
  },
);
