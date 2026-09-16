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

Given('an authenticated character for concurrent wallet ops', function () {
  // Staggered delays make responses arrive out of request order.
  queueResponse({
    match: balanceMatch(WALLET_CHARACTER_ID),
    body: FUNDED_BALANCE,
    delayMs: 30,
  });
  queueResponse({
    match: walletPaths.journal(WALLET_CHARACTER_ID),
    headers: SINGLE_PAGE,
    body: walletFixtures.singleJournalEntry(),
    delayMs: 15,
  });
  queueResponse({
    match: walletPaths.transactions(WALLET_CHARACTER_ID),
    body: walletFixtures.singleTransaction(),
  });
});
