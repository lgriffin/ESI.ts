import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'SSO accepts the next revocation with a body that never arrives',
  function () {
    queueResponse({
      match: '/v2/oauth/revoke',
      status: 200,
      body: 'revoked',
      fault: { kind: 'body-stall', bytes: 0 },
    });
  },
);
