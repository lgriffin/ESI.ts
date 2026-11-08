import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the client reads the server status with its metadata', async function () {
  await captureOutcome(this, () =>
    this.client.status.withMetadata().getStatus(),
  );
});
