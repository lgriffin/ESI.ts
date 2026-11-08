import { signedToken, verifyWith } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'a token whose header segment is {string} is verified',
  async function (header: string) {
    const [, ...rest] = signedToken(this.values.verification.clock).split('.');
    await verifyWith(
      this,
      [Buffer.from(header).toString('base64url'), ...rest].join('.'),
    );
  },
);
