import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  "EVE SSO's key set endpoint fails with the network error {string}",
  function (message: string) {
    verificationState(this).answer = { networkError: message };
  },
);
