import { When } from '../../support/steps';

When('the client requests all attributes', async function () {
  this.result = await this.client.dogma.getAttributes();
});
