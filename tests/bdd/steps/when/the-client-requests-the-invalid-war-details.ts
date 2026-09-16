import { UNKNOWN_WAR_ID } from '../../support/wars';
import { When } from '../../support/steps';

When('the client requests the invalid war details', async function () {
  try {
    await this.client.wars.getWarById(UNKNOWN_WAR_ID);
  } catch (error) {
    this.error = error;
  }
});
