import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When('refreshAll runs', async function () {
  await attempt(this, () => manager(this).manager.refreshAll());
});
