import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key that expired {int} seconds ago is verified with a clock tolerance of {int} seconds",
  async function (ago: number, tolerance: number) {
    const state = this.values.verification;
    await verifyWith(
      this,
      signedToken(state.clock, {
        claims: (c) => ({ ...c, exp: (c.iat as number) - ago }),
      }),
      { clockToleranceSeconds: tolerance },
    );
  },
);
