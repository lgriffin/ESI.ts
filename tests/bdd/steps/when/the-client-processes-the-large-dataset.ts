import { When } from '../../support/steps';

When('the client processes the large dataset', async function () {
  const startTime = Date.now();
  this.result = await this.client.universe.getSystems();
  this.values.elapsedMs = Date.now() - startTime;
});
