import {
  FUNDED_BALANCE,
  WALLET_CHARACTER_ID,
  balanceMatch,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character for wallet', function () {
  queueResponse({
    match: balanceMatch(WALLET_CHARACTER_ID),
    body: FUNDED_BALANCE,
  });
});
