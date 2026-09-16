import { When } from '../../support/steps';

When('the client examines the tiers for a ship type', async function () {
  const result = await this.client.insurance.getInsurancePrices();
  this.result = result[0].levels;
});
