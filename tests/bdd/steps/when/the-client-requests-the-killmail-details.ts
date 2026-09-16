import { REPORT_KILLMAIL } from '../../support/killmails';
import { When } from '../../support/steps';

When('the client requests the killmail details', async function () {
  this.result = await this.client.killmails.getKillmail(
    REPORT_KILLMAIL.id,
    REPORT_KILLMAIL.hash,
  );
});
