import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When(
  'the client requests a character wallet balance without auth',
  async function () {
    try {
      await this.client.wallet.getCharacterWallet(WALLET_CHARACTER_ID);
    } catch (error) {
      this.error = error;
    }
  },
);
