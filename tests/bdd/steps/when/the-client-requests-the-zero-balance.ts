import { BROKE_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests the zero balance', async function () {
  this.result = await this.client.wallet.getCharacterWallet(BROKE_CHARACTER_ID);
});
