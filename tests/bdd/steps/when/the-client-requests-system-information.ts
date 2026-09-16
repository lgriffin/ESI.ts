import { JITA } from '../../support/universe';
import { When } from '../../support/steps';

When('the client requests system information', async function () {
  this.result = await this.client.universe.getSystemById(JITA);
});
