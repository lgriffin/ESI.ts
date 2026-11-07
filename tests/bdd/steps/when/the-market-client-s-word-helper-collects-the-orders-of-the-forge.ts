import { THE_FORGE } from '../../support/market';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  "the market client's {word} helper collects the orders of The Forge",
  async function (helper: string) {
    const market = this.client.market;
    await captureOutcome(this, async () => {
      if (helper === 'fetch-all') return market.fetchAllMarketOrders(THE_FORGE);
      const orders: unknown[] = [];
      for await (const page of market.streamMarketOrders(THE_FORGE)) {
        orders.push(...page.data);
      }
      return orders;
    });
  },
);
