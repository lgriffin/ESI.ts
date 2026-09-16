import { When } from '../../support/steps';

When('the client requests the list of wars', async function () {
  this.result = await this.client.wars.getWars();
});
