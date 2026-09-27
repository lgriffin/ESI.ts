import { WALLET_BALANCE } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then('the first view shall receive the wallet balance', function () {
  expect(this.values.first).toBe(WALLET_BALANCE);
});
