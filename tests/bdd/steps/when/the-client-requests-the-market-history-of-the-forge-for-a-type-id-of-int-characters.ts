import { THE_FORGE } from '../../support/market';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client requests the market history of The Forge for a type ID of {int} characters',
  async function (length: number) {
    // A caller passing an unchecked string where the type says number.
    const typeId = '3'.repeat(length) as unknown as number;
    await captureOutcome(this, () =>
      this.client.market.getMarketHistory(THE_FORGE, typeId),
    );
  },
);
