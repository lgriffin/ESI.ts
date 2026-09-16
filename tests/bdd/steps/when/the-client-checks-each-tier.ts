import { When } from '../../support/steps';

When('the client checks each tier', async function () {
  this.result = await this.client.insurance.getInsurancePrices();
});
