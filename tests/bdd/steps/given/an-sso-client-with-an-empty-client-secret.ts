import { ssoClient } from '../../support/sso-client';
import { Given } from '../../support/steps';

Given('an SSO client with an empty client secret', function () {
  ssoClient(this, { clientSecret: '' });
});
