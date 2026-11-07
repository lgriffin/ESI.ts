import { storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  'character {int} is stored with an access token valid for {int} minutes',
  async function (characterId: number, minutes: number) {
    await storeCharacter(this, characterId, { expiresInSeconds: minutes * 60 });
  },
);
