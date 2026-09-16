import { When } from '../../support/steps';

When('the client processes the large insurance response', async function () {
  const startTime = Date.now();
  this.result = await this.client.insurance.getInsurancePrices();
  this.values.elapsedMs = Date.now() - startTime;
});
