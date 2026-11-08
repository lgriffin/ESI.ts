import { statusSpecTtl } from '../../support/pipeline-edges';
import type { ManualClock } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the client reads the server status with its metadata, waits its spec TTL and reads it again',
  async function () {
    const status = this.client.status.withMetadata();
    await status.getStatus();
    (this.values.clock as ManualClock).advance(statusSpecTtl());
    this.result = await status.getStatus();
  },
);
