import { captureOutcome } from '../../support/outcome';
import { walletClientOf } from '../../support/mock-transport';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('the wallet client requests the wallet balance', async function () {
  await captureOutcome(this, () =>
    walletClientOf(this).getCharacterWallet(CHARACTER_ID),
  );
});
