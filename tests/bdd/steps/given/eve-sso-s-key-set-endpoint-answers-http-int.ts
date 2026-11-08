import { verificationState } from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  "EVE SSO's key set endpoint answers HTTP {int}",
  function (status: number) {
    verificationState(this).answer = {
      status,
      body: JSON.stringify({ error: 'unavailable' }),
    };
  },
);
