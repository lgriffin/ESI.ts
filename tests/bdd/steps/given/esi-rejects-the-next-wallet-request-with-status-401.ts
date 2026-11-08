import { WALLET_PATH } from '../../support/shared-runtime';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI rejects the next wallet request with status 401', function () {
  queueResponse({
    match: WALLET_PATH,
    status: 401,
    body: { error: 'token is expired' },
  });
});
