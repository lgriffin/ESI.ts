import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests their wallet balance', async function () {
  this.result =
    await this.client.wallet.getCharacterWallet(WALLET_CHARACTER_ID);
});
