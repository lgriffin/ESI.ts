import { ACTIVE_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the war killmails', async function () {
  this.result = await this.client.wars.getWarKillmails(ACTIVE_WAR_ID);
});
