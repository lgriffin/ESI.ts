import { When } from '../../support/steps';

When('the client requests the status', async function () {
  this.result = await this.client.status.getStatus();
});
