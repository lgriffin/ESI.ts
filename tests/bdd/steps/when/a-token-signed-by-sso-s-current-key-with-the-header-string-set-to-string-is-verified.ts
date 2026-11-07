import {
  signedToken,
  verifyWith,
  jsonValue,
} from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key with the header {string} set to {string} is verified",
  async function (field: string, value: string) {
    await verifyWith(
      this,
      signedToken(this.values.verification.clock, {
        header: (h) => ({ ...h, [field]: jsonValue(value) }),
      }),
    );
  },
);
