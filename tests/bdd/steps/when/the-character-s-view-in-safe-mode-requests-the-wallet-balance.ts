import { captureOutcome } from '../../support/outcome';
import {
  CHARACTER_ID,
  identityOf,
  runtimeOf,
} from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the character's view in safe mode requests the wallet balance",
  async function () {
    const view = runtimeOf(this).withSafeMode().as(identityOf(this));
    await captureOutcome(this, () => view.character(CHARACTER_ID).wallet.get());
  },
);
