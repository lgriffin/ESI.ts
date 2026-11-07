import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with the name {string} and the scopes {string}',
  async function (characterId: number, characterName: string, scopes: string) {
    await storeCharacter(this, characterId, {
      characterName,
      scopes: scopes.split(' '),
    });
  },
);
