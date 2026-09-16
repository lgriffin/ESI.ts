import { NEW_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests the new character wallet journal', async function () {
  this.result =
    await this.client.wallet.getCharacterWalletJournal(NEW_CHARACTER_ID);
});
