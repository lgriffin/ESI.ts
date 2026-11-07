import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key with its {word} segment emptied is verified",
  async function (segment: string) {
    const parts = signedToken(this.values.verification.clock).split('.');
    parts[segment === 'payload' ? 1 : 2] = '';
    await verifyWith(this, parts.join('.'));
  },
);
