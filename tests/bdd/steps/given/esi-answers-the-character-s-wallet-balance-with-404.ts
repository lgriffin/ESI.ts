import { WALLET_PATH } from '../../support/shared-runtime';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given("ESI answers the character's wallet balance with 404", function () {
  queueError(404, 'Character not found', { match: WALLET_PATH });
});
