import { WALLET_BALANCE } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then('the wallet client shall receive the wallet balance', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toBe(WALLET_BALANCE);
});
