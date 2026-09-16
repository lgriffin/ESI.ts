import { MUTUAL_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the mutual war details', async function () {
  this.result = await this.client.wars.getWarById(MUTUAL_WAR_ID);
});
