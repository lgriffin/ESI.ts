import { attempt, manager } from '../../support/token-manager';
import { When } from '../../support/steps';

When('refreshAll runs with an aborted signal', async function () {
  const controller = new AbortController();
  controller.abort();
  await attempt(this, () =>
    manager(this).manager.refreshAll({ signal: controller.signal }),
  );
});
