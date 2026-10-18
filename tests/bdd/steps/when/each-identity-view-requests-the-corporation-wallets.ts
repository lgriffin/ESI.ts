import { viewOf } from '../../support/identity-views';
import { captureOutcome } from '../../support/outcome';
import { CORPORATION_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('each identity view requests the corporation wallets', async function () {
  await captureOutcome(this, async () => {
    await viewOf(this, 'first').wallet.getCorporationWallets(CORPORATION_ID);
    return viewOf(this, 'second').wallet.getCorporationWallets(CORPORATION_ID);
  });
});
