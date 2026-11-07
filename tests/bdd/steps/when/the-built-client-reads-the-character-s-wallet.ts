import { surfaceOf } from '../../support/client-construction';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When("the built client reads the character's wallet", async function () {
  await captureOutcome(this, () => surfaceOf(this).getWallet(CHARACTER_ID));
});
