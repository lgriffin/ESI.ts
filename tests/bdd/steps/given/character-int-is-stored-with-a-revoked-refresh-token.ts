import { manager, storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with a revoked refresh token',
  async function (characterId: number) {
    await storeCharacter(this, characterId, {
      revokedAt: manager(this).clock - 1000,
    });
  },
);
