import { CONCURRENT_REGIONS } from '../../support/market';
import { When } from '../../support/steps';

When('the client makes them simultaneously', async function () {
  this.result = await Promise.all(
    CONCURRENT_REGIONS.map((regionId) =>
      this.client.market.getMarketOrders(regionId),
    ),
  );
});
