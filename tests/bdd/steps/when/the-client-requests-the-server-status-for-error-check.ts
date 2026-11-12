import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client requests the server status for error check',
  async function () {
    await captureOutcome(this, () => this.client.status.getStatus());
  },
);
