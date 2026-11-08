import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  "EVE SSO's key set endpoint answers with the body {string}",
  function (body: string) {
    verificationState(this).answer = { status: 200, body };
  },
);
