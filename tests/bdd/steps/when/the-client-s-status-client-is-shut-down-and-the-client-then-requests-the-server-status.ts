import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  "the client's status client is shut down and the client then requests the server status",
  async function () {
    this.client.status.shutdown();
    await captureOutcome(this, () => this.client.status.getStatus());
  },
);
