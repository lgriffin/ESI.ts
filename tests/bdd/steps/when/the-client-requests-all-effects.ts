import { When } from '../../support/steps';

When('the client requests all effects', async function () {
  this.result = await this.client.dogma.getEffects();
});
