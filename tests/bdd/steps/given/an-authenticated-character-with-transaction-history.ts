import {
  SINGLE_PAGE,
  WALLET_CHARACTER_ID,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with transaction history', function () {
  queueResponse({
    match: walletPaths.journal(WALLET_CHARACTER_ID),
    headers: SINGLE_PAGE,
    body: walletFixtures.journal(),
  });
});
