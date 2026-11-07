import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'SSO refuses the next revocation with HTTP {int} and the error code {string}',
  function (status: number, error: string) {
    queueResponse({ match: '/v2/oauth/revoke', status, body: { error } });
  },
);
