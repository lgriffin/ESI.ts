import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When('the application lists the characters', async function () {
  await attempt(this, () => manager(this).manager.listCharacters());
});
