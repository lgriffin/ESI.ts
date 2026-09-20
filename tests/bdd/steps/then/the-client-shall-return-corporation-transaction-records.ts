import {
  MASTER_DIVISION,
  WALLET_CORPORATION_ID,
  walletPaths,
} from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return corporation transaction records', function () {
  expect(lastRequest().url.pathname).toBe(
    walletPaths.corporationTransactions(WALLET_CORPORATION_ID, MASTER_DIVISION),
  );
  expect(this.result).toHaveLength(1);
  expect(this.result[0]).toMatchObject({
    transaction_id: 987654321,
    type_id: 34,
    unit_price: 5.5,
    quantity: 10000000,
    is_buy: true,
  });
});
