import { WALLET_CORPORATION_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests corporation wallets', async function () {
  this.result = await this.client.wallet.getCorporationWallets(
    WALLET_CORPORATION_ID,
  );
});
