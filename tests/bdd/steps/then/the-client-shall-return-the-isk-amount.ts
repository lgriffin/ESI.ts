import { WALLET_CHARACTER_ID, walletPaths } from '../../support/wallet';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the ISK amount', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toBe(walletPaths.balance(WALLET_CHARACTER_ID));
  expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
  expect(this.result).toBe(5250000000.75);
});
