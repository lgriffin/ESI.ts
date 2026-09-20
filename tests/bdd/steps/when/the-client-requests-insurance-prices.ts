import { When } from '../../support/steps';

When('the client requests insurance prices', async function () {
  this.result = await this.client.insurance.getInsurancePrices();
});
