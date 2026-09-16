import { WALLET_CHARACTER_ID, walletPaths } from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return transaction records', function () {
  expect(lastRequest().url.pathname).toBe(
    walletPaths.transactions(WALLET_CHARACTER_ID),
  );
  expect(
    this.result.map((t: any) => [
      t.transaction_id,
      t.type_id,
      t.unit_price,
      t.quantity,
      t.is_buy,
    ]),
  ).toEqual([
    [123456789, 34, 5.5, 1000, false],
    [123456790, 35, 12.0, 500, true],
  ]);
});
