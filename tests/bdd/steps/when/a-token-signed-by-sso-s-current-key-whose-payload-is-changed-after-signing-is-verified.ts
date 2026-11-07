import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  "a token signed by SSO's current key whose payload is changed after signing is verified",
  async function () {
    const [header, payload, signature] = signedToken(
      this.values.verification.clock,
    ).split('.');
    const claims = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    const forged = Buffer.from(
      JSON.stringify({ ...claims, sub: 'CHARACTER:EVE:90000001' }),
    ).toString('base64url');
    await verifyWith(this, `${header}.${forged}.${signature}`);
  },
);
