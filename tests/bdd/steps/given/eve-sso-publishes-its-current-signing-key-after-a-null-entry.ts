import {
  verificationState,
  currentJwk,
  keySetBody,
} from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  'EVE SSO publishes its current signing key after a null entry',
  function () {
    verificationState(this).answer = {
      status: 200,
      body: keySetBody([null, currentJwk()]),
    };
  },
);
