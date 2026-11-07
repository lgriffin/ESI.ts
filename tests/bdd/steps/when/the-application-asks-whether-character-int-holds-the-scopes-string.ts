import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'the application asks whether character {int} holds the scopes {string}',
  async function (characterId: number, scopes: string) {
    await attempt(this, () =>
      manager(this).manager.hasScopes(characterId, scopes.split(' ')),
    );
  },
);
