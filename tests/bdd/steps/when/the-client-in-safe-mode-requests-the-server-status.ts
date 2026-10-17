import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the client in safe mode requests the server status', async function () {
  await captureOutcome(this, () =>
    this.client.withSafeMode().status.getStatus(),
  );
});
