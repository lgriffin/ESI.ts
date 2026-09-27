import {
  CORPORATION_WALLETS_PATH,
  corporationWallets,
} from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI reports the corporation wallets twice', function () {
  queueResponse({
    match: CORPORATION_WALLETS_PATH,
    body: corporationWallets(),
    times: 2,
  });
});
