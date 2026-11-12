import { When } from '../../support/steps';

When('the client checks the start time', async function () {
  this.result = await this.client.status.getStatus();
});
