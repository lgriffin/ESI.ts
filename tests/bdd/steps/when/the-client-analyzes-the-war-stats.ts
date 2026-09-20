import { ACTIVE_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client analyzes the war stats', async function () {
  this.result = await this.client.wars.getWarById(ACTIVE_WAR_ID);
});
