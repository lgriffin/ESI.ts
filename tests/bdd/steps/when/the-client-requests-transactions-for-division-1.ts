import { MASTER_DIVISION, WALLET_CORPORATION_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests transactions for division 1', async function () {
  this.result = await this.client.wallet.getCorporationWalletTransactions(
    WALLET_CORPORATION_ID,
    MASTER_DIVISION,
  );
});
