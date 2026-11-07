import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key that expires now is verified",
  async function () {
    const state = this.values.verification;
    const token = signedToken(state.clock, {
      claims: (c) => ({ ...c, exp: c.iat }),
    });
    state.clock = Math.floor(state.clock / 1000) * 1000;
    this.values.expiresAt = new Date(state.clock).toISOString();
    await verifyWith(this, token);
  },
);
