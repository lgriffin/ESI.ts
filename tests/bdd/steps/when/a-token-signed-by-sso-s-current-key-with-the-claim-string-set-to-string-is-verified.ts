import {
  signedToken,
  verifyWith,
  jsonValue,
} from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key with the claim {string} set to {string} is verified",
  async function (claim: string, value: string) {
    await verifyWith(
      this,
      signedToken(this.values.verification.clock, {
        claims: (c) => ({ ...c, [claim]: jsonValue(value) }),
      }),
    );
  },
);
