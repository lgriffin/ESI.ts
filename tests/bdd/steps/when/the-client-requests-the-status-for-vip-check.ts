import { When } from '../../support/steps';

When('the client requests the status for VIP check', async function () {
  this.result = await this.client.status.getStatus();
});
