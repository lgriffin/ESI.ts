import { captureOutcome } from '../../support/outcome';
import { walkMarketOrders } from '../../support/paging';
import { When } from '../../support/steps';

When(
  'the client walks the market orders through the {word} entry point',
  async function (entryPoint: string) {
    await captureOutcome(this, () => walkMarketOrders(this.client, entryPoint));
  },
);
