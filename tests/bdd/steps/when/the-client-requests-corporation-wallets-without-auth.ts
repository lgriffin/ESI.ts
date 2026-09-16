import { WALLET_CORPORATION_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests corporation wallets without auth', async function () {
  try {
    await this.client.wallet.getCorporationWallets(WALLET_CORPORATION_ID);
  } catch (error) {
    this.error = error;
  }
});
