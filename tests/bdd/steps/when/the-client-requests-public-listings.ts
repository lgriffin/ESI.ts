import { When } from '../../support/steps';

When('the client requests public listings', async function () {
  this.result = await this.client.paragonHub.getPublicListings();
});
