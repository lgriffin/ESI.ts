import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'the application asks for the access token of character {int}',
  async function (characterId: number) {
    await attempt(this, () => manager(this).manager.getToken(characterId));
  },
);
