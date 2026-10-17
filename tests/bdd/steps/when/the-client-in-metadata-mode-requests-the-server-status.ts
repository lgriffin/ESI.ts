import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client in metadata mode requests the server status',
  async function () {
    await captureOutcome(this, () =>
      this.client.withMetadata().status.getStatus(),
    );
  },
);
