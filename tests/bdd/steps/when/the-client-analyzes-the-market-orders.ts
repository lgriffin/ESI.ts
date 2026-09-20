import { THE_FORGE } from '../../support/market';
import { When } from '../../support/steps';

When('the client analyzes the market orders', async function () {
  const orders = await this.client.market.getMarketOrders(THE_FORGE);
  this.values.buyOrders = orders.filter((order) => order.is_buy_order);
  this.values.sellOrders = orders.filter((order) => !order.is_buy_order);
});
