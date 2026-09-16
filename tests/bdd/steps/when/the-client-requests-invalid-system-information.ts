import { UNKNOWN_SYSTEM_ID } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests invalid system information', async function () {
  try {
    await this.client.universe.getSystemById(UNKNOWN_SYSTEM_ID);
  } catch (error) {
    this.error = error;
  }
});
