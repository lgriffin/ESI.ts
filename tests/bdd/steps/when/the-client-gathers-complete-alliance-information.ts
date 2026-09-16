import { GOONSWARM_ALLIANCE_ID } from '../../support/alliance';
import { When } from '../../support/steps';

When('the client gathers complete alliance information', async function () {
  const [alliance, contacts, corporations] = await Promise.all([
    this.client.alliance.getAllianceById(GOONSWARM_ALLIANCE_ID),
    this.client.alliance.getContacts(GOONSWARM_ALLIANCE_ID),
    this.client.alliance.getCorporations(GOONSWARM_ALLIANCE_ID),
  ]);
  this.result = { alliance, contacts, corporations };
});
