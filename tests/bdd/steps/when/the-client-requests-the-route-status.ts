import { When } from '../../support/steps';

When('the client requests the route status', async function () {
  this.result = await this.client.meta.getStatus();
});
