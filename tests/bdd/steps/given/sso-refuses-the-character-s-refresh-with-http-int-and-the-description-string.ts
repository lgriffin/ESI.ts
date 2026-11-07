import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  "SSO refuses the character's refresh with HTTP {int} and the description {string}",
  function (status: number, description: string) {
    queueResponse({
      status,
      match: '/v2/oauth/token',
      body: { error: 'invalid_request', error_description: description },
    });
  },
);
