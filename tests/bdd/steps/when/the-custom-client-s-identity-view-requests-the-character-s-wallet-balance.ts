import { customViewOf } from '../../support/identity-views';
import { captureOutcome } from '../../support/outcome';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the custom client's identity view requests the character's wallet balance",
  async function () {
    await captureOutcome(this, () =>
      customViewOf(this).wallet!.getCharacterWallet(CHARACTER_ID),
    );
  },
);
