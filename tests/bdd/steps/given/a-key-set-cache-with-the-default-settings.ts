import { SsoJwks } from '../../../../src/auth/jwks';
import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given('a key set cache with the default settings', function () {
  const state = verificationState(this);
  this.values.jwks = new SsoJwks({ fetch: state.fetch, now: state.now });
});
