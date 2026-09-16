import {
  MASTER_DIVISION,
  WALLET_CORPORATION_ID,
  walletPaths,
} from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return journal entries for that division', function () {
  expect(lastRequest().url.pathname).toBe(
    walletPaths.corporationJournal(WALLET_CORPORATION_ID, MASTER_DIVISION),
  );
  expect(this.result).toHaveLength(1);
  expect(this.result[0]).toMatchObject({
    id: 2000000001,
    ref_type: 'corporation_account_withdrawal',
    amount: -50000000.0,
    balance: 950000000.0,
  });
});
