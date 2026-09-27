import { CHARACTER_ID } from '../../support/shared-runtime';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When("the character's view requests the wallet balance", async function () {
  await captureOutcome(this, () =>
    this.views.character!.character(CHARACTER_ID).wallet.get(),
  );
});
