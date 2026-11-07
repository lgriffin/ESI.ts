import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given('EVE SSO publishes its current signing key', function () {
  verificationState(this);
});
