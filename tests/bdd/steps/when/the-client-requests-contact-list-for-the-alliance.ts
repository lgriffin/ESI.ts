import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When('the client requests contact list for the alliance', async function () {
  this.result = await this.client.alliance.getContacts(GOONSWARM_ALLIANCE_ID);
});
