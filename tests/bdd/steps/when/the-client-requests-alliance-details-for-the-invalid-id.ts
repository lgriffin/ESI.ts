import { UNKNOWN_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When(
  'the client requests alliance details for the invalid ID',
  async function () {
    try {
      await this.client.alliance.getAllianceById(UNKNOWN_ALLIANCE_ID);
    } catch (e) {
      this.error = e;
    }
  },
);
