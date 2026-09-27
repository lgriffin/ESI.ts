import { esiRequests, WALLET_BALANCE } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the call shall resolve with the wallet balance after one request',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result).toBe(WALLET_BALANCE);
    expect(esiRequests()).toHaveLength(1);
  },
);
