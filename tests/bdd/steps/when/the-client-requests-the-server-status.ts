import { When } from '../../support/steps';

When('the client requests the server status', async function () {
  this.result = await this.client.status.getStatus();
});
