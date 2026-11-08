import { ssoClient } from '../../support/sso-client';
import { Given } from '../../support/steps';

Given('an SSO client', function () {
  ssoClient(this);
});
