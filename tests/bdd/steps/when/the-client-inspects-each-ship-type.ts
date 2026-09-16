import { When } from '../../support/steps';

When('the client inspects each ship type', async function () {
  this.result = await this.client.insurance.getInsurancePrices();
});
