import { verifyAccessToken } from '../../../../src/auth/jwks';
import {
  signedToken,
  VERIFY_CLIENT_ID,
} from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "two tokens signed by SSO's current key are verified with a clock and no fetch",
  async function () {
    const state = this.values.verification;
    const verify = () =>
      verifyAccessToken(signedToken(state.clock), {
        clientId: VERIFY_CLIENT_ID,
        now: state.now,
      });
    this.result = [await verify(), await verify()];
  },
);
