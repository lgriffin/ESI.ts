import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key with {string} appended is verified",
  async function (suffix: string) {
    await verifyWith(
      this,
      signedToken(this.values.verification.clock) + suffix,
    );
  },
);
