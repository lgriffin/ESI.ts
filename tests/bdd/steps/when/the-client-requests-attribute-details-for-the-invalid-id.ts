import { UNKNOWN_DOGMA_ID } from '../../support/dogma';
import { When } from '../../support/steps';

When(
  'the client requests attribute details for the invalid ID',
  async function () {
    try {
      await this.client.dogma.getAttributeById(UNKNOWN_DOGMA_ID);
    } catch (error) {
      this.error = error;
    }
  },
);
