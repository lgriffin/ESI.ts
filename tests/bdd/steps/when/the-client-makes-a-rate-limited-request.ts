import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When('the client makes a rate limited request', async function () {
  try {
    await this.client.alliance.getAllianceById(GOONSWARM_ALLIANCE_ID);
  } catch (e) {
    this.error = e;
  }
});
