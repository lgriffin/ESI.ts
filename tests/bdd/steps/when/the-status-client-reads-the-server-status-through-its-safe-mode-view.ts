import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the status client reads the server status through its safe mode view',
  async function () {
    await captureOutcome(this, () =>
      this.client.status.withSafeMode().getStatus(),
    );
  },
);
