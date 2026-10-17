import { WALLET_BALANCE } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then('the result shall hold the wallet balance as its data', function () {
  expect(this.error).toBeUndefined();
  expect(this.result.data).toBe(WALLET_BALANCE);
});
