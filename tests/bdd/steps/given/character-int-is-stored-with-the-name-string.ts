import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with the name {string}',
  async function (characterId: number, characterName: string) {
    await storeCharacter(this, characterId, { characterName });
  },
);
