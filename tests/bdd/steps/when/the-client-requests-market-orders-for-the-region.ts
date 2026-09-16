import { THE_FORGE } from '../../support/market';
import { When } from '../../support/steps';

When('the client requests market orders for the region', async function () {
  this.result = await this.client.market.getMarketOrders(THE_FORGE);
});
