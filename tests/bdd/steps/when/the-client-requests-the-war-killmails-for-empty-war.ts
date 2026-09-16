import { EMPTY_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the war killmails for empty war', async function () {
  this.result = await this.client.wars.getWarKillmails(EMPTY_WAR_ID);
});
