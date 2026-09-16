import { THE_FORGE, TRITANIUM } from '../../support/market';
import { When } from '../../support/steps';

When('the client requests market history', async function () {
  this.result = await this.client.market.getMarketHistory(THE_FORGE, TRITANIUM);
});
