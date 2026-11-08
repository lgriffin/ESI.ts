import { decodeJwtPayload } from '../../../../src/auth/jwt';
import { storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "the stored token for character {int} shall expire when its access token's exp claim says",
  async function (characterId: number) {
    const stored = await storedToken(this, characterId);
    const claims = decodeJwtPayload(this.values.importedAccessToken);
    expect(stored.expiresAt).toBe((claims.exp as number) * 1000);
  },
);
