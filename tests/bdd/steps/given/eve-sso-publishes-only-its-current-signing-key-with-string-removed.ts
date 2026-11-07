import {
  verificationState,
  currentJwk,
  keySetBody,
} from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  'EVE SSO publishes only its current signing key with {string} removed',
  function (field: string) {
    const jwk = currentJwk();
    delete jwk[field];
    verificationState(this).answer = { status: 200, body: keySetBody([jwk]) };
  },
);
