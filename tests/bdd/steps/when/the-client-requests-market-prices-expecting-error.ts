import { When } from '../../support/steps';

When('the client requests market prices expecting error', async function () {
  try {
    await this.client.market.getMarketPrices();
  } catch (error) {
    this.error = error;
  }
});
