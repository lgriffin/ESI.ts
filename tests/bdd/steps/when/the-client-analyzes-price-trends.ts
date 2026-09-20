import { THE_FORGE, TRITANIUM } from '../../support/market';
import { When } from '../../support/steps';

When('the client analyzes price trends', async function () {
  const history = await this.client.market.getMarketHistory(
    THE_FORGE,
    TRITANIUM,
  );
  this.result = history;
  this.values.priceChanges = history
    .slice(1)
    .map((day, index) => day.average - history[index].average);
});
