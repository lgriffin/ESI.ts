import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'character {int} is added from the code {string}',
  async function (_characterId: number, code: string) {
    await attempt(this, () => manager(this).manager.addCharacter(code));
  },
);
