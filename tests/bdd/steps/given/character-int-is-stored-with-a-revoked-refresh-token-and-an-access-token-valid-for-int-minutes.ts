import { manager, storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with a revoked refresh token and an access token valid for {int} minutes',
  async function (characterId: number, minutes: number) {
    await storeCharacter(this, characterId, {
      revokedAt: manager(this).clock - 1000,
      expiresInSeconds: minutes * 60,
    });
  },
);
