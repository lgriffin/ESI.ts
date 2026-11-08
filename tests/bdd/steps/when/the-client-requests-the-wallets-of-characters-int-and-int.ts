import { settle } from '../../support/pipeline-edges';
import { When } from '../../support/steps';

When(
  'the client requests the wallets of characters {int} and {int}',
  async function (first: number, second: number) {
    const wallet = this.client.wallet;
    this.values.outcomes = [
      await settle(() => wallet.getCharacterWallet(first)),
      await settle(() => wallet.getCharacterWallet(second)),
    ];
  },
);
