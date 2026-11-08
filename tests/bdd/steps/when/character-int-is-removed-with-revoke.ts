import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'character {int} is removed with revoke',
  async function (characterId: number) {
    await attempt(this, () =>
      manager(this).manager.removeCharacter(characterId, { revoke: true }),
    );
  },
);
