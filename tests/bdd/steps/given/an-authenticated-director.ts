import {
  WALLET_CORPORATION_ID,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated director', function () {
  queueResponse({
    match: walletPaths.corporationWallets(WALLET_CORPORATION_ID),
    body: walletFixtures.corporationWallets(),
  });
});
