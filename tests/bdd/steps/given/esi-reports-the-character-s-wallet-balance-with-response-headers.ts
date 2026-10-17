import {
  RESPONSE_HEADERS,
  WALLET_BALANCE,
  WALLET_PATH,
} from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  "ESI reports the character's wallet balance with response headers",
  function () {
    queueResponse({
      match: WALLET_PATH,
      body: WALLET_BALANCE,
      headers: RESPONSE_HEADERS,
    });
  },
);
