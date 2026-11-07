import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with the scopes {string}',
  async function (characterId: number, scopes: string) {
    await storeCharacter(this, characterId, { scopes: scopes.split(' ') });
  },
);
