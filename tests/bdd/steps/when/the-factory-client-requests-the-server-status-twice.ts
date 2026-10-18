import { factoryClientOf } from '../../support/factory-client';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the factory client requests the server status twice', async function () {
  await captureOutcome(this, async () => {
    await factoryClientOf(this).getStatus();
    return factoryClientOf(this).getStatus();
  });
});
