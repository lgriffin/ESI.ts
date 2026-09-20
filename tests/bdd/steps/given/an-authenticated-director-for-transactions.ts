import {
  MASTER_DIVISION,
  WALLET_CORPORATION_ID,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated director for transactions', function () {
  queueResponse({
    match: walletPaths.corporationTransactions(
      WALLET_CORPORATION_ID,
      MASTER_DIVISION,
    ),
    body: walletFixtures.corporationTransactions(),
  });
});
