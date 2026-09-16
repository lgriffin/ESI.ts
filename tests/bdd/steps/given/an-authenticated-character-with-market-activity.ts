import {
  WALLET_CHARACTER_ID,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with market activity', function () {
  queueResponse({
    match: walletPaths.transactions(WALLET_CHARACTER_ID),
    body: walletFixtures.transactions(),
  });
});
