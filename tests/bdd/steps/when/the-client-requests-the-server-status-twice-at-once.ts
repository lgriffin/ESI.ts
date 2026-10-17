import { When } from '../../support/steps';

When('the client requests the server status twice at once', async function () {
  this.result = await Promise.all([
    this.client.status.getStatus(),
    this.client.status.getStatus(),
  ]);
});
