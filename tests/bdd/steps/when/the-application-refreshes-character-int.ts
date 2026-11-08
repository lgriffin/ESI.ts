import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'the application refreshes character {int}',
  async function (characterId: number) {
    await attempt(this, () => manager(this).manager.refresh(characterId));
  },
);
