import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests their transactions', async function () {
  this.result =
    await this.client.wallet.getCharacterWalletTransactions(
      WALLET_CHARACTER_ID,
    );
});
