import {
  MASTER_DIVISION,
  SINGLE_PAGE,
  WALLET_CORPORATION_ID,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated director for journal', function () {
  queueResponse({
    match: walletPaths.corporationJournal(
      WALLET_CORPORATION_ID,
      MASTER_DIVISION,
    ),
    headers: SINGLE_PAGE,
    body: walletFixtures.corporationJournal(),
  });
});
