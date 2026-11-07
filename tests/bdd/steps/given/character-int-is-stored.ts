import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given('character {int} is stored', async function (characterId: number) {
  await storeCharacter(this, characterId);
});
