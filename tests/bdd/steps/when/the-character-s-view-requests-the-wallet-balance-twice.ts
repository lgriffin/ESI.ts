import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the character's view requests the wallet balance twice",
  async function () {
    const wallet = this.views.character!.character(CHARACTER_ID).wallet;
    this.result = [await wallet.get(), await wallet.get()];
  },
);
