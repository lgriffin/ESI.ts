import { WALLET_CHARACTER_ID, balanceMatch } from '../../support/wallet';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unauthenticated user for character wallet', function () {
  // The token is present but does not carry the wallet scope, so ESI
  // refuses it. 403 is not retryable: exactly one request goes out.
  queueError(403, 'Token not valid for scope(s)', {
    match: balanceMatch(WALLET_CHARACTER_ID),
  });
});
