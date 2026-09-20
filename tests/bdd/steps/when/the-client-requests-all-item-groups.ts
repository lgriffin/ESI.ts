import { When } from '../../support/steps';

When('the client requests all item groups', async function () {
  this.result = await this.client.universe.getItemGroups();
});
