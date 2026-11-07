import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with the refresh token {string}',
  async function (characterId: number, refreshToken: string) {
    await storeCharacter(this, characterId, { refreshToken });
  },
);
