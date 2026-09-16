import { When } from '../../support/steps';

When('the client requests current market prices', async function () {
  this.result = await this.client.market.getMarketPrices();
});
