import { ssoClient } from '../../support/sso-client';
import { Given } from '../../support/steps';

Given(
  'an SSO client with a request timeout of {int} ms',
  function (timeoutMs: number) {
    ssoClient(this, { timeoutMs });
  },
);
