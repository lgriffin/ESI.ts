import { MASTER_DIVISION, WALLET_CORPORATION_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When('the client requests the journal for division 1', async function () {
  this.result = await this.client.wallet.getCorporationWalletJournal(
    WALLET_CORPORATION_ID,
    MASTER_DIVISION,
  );
});
