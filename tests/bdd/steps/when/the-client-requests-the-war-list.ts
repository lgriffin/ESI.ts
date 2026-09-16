import { When } from '../../support/steps';

When('the client requests the war list', async function () {
  this.result = await this.client.wars.getWars();
});
