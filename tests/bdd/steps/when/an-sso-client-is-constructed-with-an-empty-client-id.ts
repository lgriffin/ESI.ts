import { ssoClient } from '../../support/sso-client';
import { When } from '../../support/steps';

When('an SSO client is constructed with an empty client id', function () {
  try {
    ssoClient(this, { clientId: '' });
  } catch (err: unknown) {
    this.error = err;
  }
});
