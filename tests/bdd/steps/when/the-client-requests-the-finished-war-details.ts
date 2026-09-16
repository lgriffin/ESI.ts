import { FINISHED_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the finished war details', async function () {
  this.result = await this.client.wars.getWarById(FINISHED_WAR_ID);
});
