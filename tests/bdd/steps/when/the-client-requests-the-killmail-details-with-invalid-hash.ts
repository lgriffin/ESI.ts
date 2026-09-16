import { MISMATCHED_KILLMAIL } from '../../support/killmails';
import { When } from '../../support/steps';

When(
  'the client requests the killmail details with invalid hash',
  async function () {
    try {
      await this.client.killmails.getKillmail(
        MISMATCHED_KILLMAIL.id,
        MISMATCHED_KILLMAIL.hash,
      );
    } catch (error) {
      this.error = error;
    }
  },
);
