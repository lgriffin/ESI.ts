import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next token request with HTTP {int} and a body that breaks off',
  function (status: number) {
    queueResponse({
      match: '/v2/oauth/token',
      status,
      body: '{"access_token":"abc","refresh_token":"def"}',
      fault: { kind: 'body-error', code: 'ECONNRESET', bytes: 10 },
    });
  },
);
