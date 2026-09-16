import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When(
  'the client requests alliance details during network issues',
  async function () {
    try {
      await this.client.alliance.getAllianceById(GOONSWARM_ALLIANCE_ID);
    } catch (e) {
      this.error = e;
    }
  },
);
