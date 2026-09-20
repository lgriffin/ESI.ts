import {
  FUNDED_BALANCE,
  SINGLE_PAGE,
  WALLET_CHARACTER_ID,
  balanceMatch,
  walletFixtures,
  walletPaths,
} from '../../support/wallet';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an authenticated character with financial history', function () {
  queueResponse({
    match: balanceMatch(WALLET_CHARACTER_ID),
    body: FUNDED_BALANCE,
  });
  queueResponse({
    match: walletPaths.journal(WALLET_CHARACTER_ID),
    headers: SINGLE_PAGE,
    body: walletFixtures.financialJournal(),
  });
  queueResponse({
    match: walletPaths.transactions(WALLET_CHARACTER_ID),
    body: walletFixtures.financialTransactions(),
  });
});
