import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When('the client tries to read the server status', async function () {
  await captureOutcome(this, () => this.client.status.getStatus());
});
