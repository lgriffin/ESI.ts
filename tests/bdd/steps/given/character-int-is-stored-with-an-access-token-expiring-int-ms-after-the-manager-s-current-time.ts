import { manager, storeCharacter } from '../../support/token-manager';
import { Given } from '../../support/steps';

Given(
  "character {int} is stored with an access token expiring {int} ms after the manager's current time",
  async function (characterId: number, ms: number) {
    const state = manager(this);
    const token = await storeCharacter(this, characterId);
    await state.storage.set(characterId, {
      ...token,
      expiresAt: state.clock + ms,
    });
  },
);
