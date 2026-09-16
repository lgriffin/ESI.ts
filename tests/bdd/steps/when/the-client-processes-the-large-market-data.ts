import { THE_FORGE } from '../../support/market';
import { When } from '../../support/steps';

When('the client processes the large market data', async function () {
  // The interval covers the pipeline: body parsing, Zod validation, caching.
  const start = performance.now();
  this.result = await this.client.market.getMarketOrders(THE_FORGE);
  this.values.elapsedMs = performance.now() - start;
});
