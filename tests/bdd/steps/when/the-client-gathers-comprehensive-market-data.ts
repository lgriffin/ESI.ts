import { THE_FORGE, TRITANIUM } from '../../support/market';
import { When } from '../../support/steps';

When('the client gathers comprehensive market data', async function () {
  const [prices, orders, history] = await Promise.all([
    this.client.market.getMarketPrices(),
    this.client.market.getMarketOrders(THE_FORGE),
    this.client.market.getMarketHistory(THE_FORGE, TRITANIUM),
  ]);
  this.values.prices = prices;
  this.values.orders = orders;
  this.values.history = history;
});
