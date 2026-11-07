import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'SSO answers the next token request with HTTP {int}, the error code {string} and the description {string}',
  function (status: number, error: string, description: string) {
    queueResponse({
      match: '/v2/oauth/token',
      status,
      body: { error, error_description: description },
    });
  },
);
