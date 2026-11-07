import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the next token request fails to connect', function () {
  queueResponse({
    match: '/v2/oauth/token',
    fault: { kind: 'connection-error', code: 'ECONNREFUSED' },
  });
});
