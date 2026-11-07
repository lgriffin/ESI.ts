import { ssoClient } from '../../support/sso-client';
import { Given } from '../../support/steps';

Given(
  'an SSO client for the client id {string} with the callback URL {string}',
  function (clientId: string, callbackUrl: string) {
    ssoClient(this, { clientId, callbackUrl });
  },
);
