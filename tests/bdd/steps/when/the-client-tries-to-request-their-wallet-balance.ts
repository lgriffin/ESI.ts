import { tryWalletBalance } from '../../support/security-boundary';
import { When } from '../../support/steps';

When('the client tries to request their wallet balance', async function () {
  await tryWalletBalance(this);
});
