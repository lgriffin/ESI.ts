import { When } from '../../support/steps';

When('the client requests all systems', async function () {
  this.result = await this.client.universe.getSystems();
});
