import { captureOutcome } from '../../support/outcome';
import {
  CHARACTER_ID,
  identityOf,
  runtimeOf,
} from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the character's view in metadata mode requests the wallet balance",
  async function () {
    const view = runtimeOf(this).withMetadata().as(identityOf(this));
    await captureOutcome(this, () => view.character(CHARACTER_ID).wallet.get());
  },
);
