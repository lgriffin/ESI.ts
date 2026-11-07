import { THE_FORGE } from '../../support/market';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client requests the market history of The Forge for the type ID {word}',
  async function (value: string) {
    const typeId = value === 'null' ? null : Number(value);
    await captureOutcome(this, () =>
      this.client.market.getMarketHistory(THE_FORGE, typeId as number),
    );
  },
);
