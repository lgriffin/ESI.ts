import { ACTIVE_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the war details', async function () {
  this.result = await this.client.wars.getWarById(ACTIVE_WAR_ID);
});
