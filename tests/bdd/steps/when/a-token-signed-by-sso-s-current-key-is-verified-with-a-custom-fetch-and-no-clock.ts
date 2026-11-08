import { verifyAccessToken } from '../../../../src/auth/jwks';
import {
  signedToken,
  VERIFY_CLIENT_ID,
} from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key is verified with a custom fetch and no clock",
  async function () {
    const state = this.values.verification;
    try {
      this.result = await verifyAccessToken(signedToken(Date.now()), {
        clientId: VERIFY_CLIENT_ID,
        fetch: state.fetch,
      });
    } catch (err: unknown) {
      this.error = err;
    }
  },
);
