import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client reads the server status through the fetch-all helper',
  async function () {
    await captureOutcome(this, () =>
      this.client.status.fetchAllEndpoint('getStatus', []),
    );
  },
);
