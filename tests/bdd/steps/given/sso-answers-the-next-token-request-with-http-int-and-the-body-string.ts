import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next token request with HTTP {int} and the body {string}',
  function (status: number, body: string) {
    queueResponse({
      match: '/v2/oauth/token',
      status,
      headers: { 'content-type': 'application/json' },
      body,
    });
  },
);
