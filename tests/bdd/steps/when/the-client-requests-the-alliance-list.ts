import { When } from '../../support/steps';

When('the client requests the alliance list', async function () {
  this.result = await this.client.alliance.getAlliances();
});
