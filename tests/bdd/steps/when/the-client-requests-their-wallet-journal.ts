import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests their wallet journal', async function () {
  this.result =
    await this.client.wallet.getCharacterWalletJournal(WALLET_CHARACTER_ID);
});
