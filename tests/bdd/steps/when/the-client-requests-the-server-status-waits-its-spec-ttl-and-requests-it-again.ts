import { statusSpecTtl } from '../../support/pipeline-edges';
import type { ManualClock } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the client requests the server status, waits its spec TTL and requests it again',
  async function () {
    await this.client.status.getStatus();
    (this.values.clock as ManualClock).advance(statusSpecTtl());
    this.result = await this.client.status.getStatus();
  },
);
