import { UNKNOWN_DOGMA_ID } from '../../support/dogma';
import { When } from '../../support/steps';

When(
  'the client requests effect details for the invalid ID',
  async function () {
    try {
      await this.client.dogma.getEffectById(UNKNOWN_DOGMA_ID);
    } catch (error) {
      this.error = error;
    }
  },
);
