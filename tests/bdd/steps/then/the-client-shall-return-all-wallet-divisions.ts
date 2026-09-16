import { WALLET_CORPORATION_ID, walletPaths } from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return all wallet divisions', function () {
  expect(lastRequest().url.pathname).toBe(
    walletPaths.corporationWallets(WALLET_CORPORATION_ID),
  );
  expect(this.result).toEqual([
    { division: 1, balance: 1000000000.0 },
    { division: 2, balance: 500000000.0 },
    { division: 3, balance: 250000000.0 },
    { division: 4, balance: 100000000.0 },
    { division: 5, balance: 50000000.0 },
    { division: 6, balance: 25000000.0 },
    { division: 7, balance: 0 },
  ]);
});
