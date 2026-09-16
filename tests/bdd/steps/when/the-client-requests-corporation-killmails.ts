import { CORPORATION_ID } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client requests corporation killmails', async function () {
  this.result =
    await this.client.killmails.getCorporationRecentKillmails(CORPORATION_ID);
});
