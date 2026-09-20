import { UNKNOWN_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests killmails for invalid war', async function () {
  try {
    await this.client.wars.getWarKillmails(UNKNOWN_WAR_ID);
  } catch (error) {
    this.error = error;
  }
});
