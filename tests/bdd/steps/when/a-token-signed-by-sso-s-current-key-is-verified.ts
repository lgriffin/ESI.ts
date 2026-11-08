import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When("a token signed by SSO's current key is verified", async function () {
  await verifyWith(this, signedToken(this.values.verification.clock));
});
