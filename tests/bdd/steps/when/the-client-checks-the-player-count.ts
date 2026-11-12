import { When } from '../../support/steps';

When('the client checks the player count', async function () {
  this.result = await this.client.status.getStatus();
});
