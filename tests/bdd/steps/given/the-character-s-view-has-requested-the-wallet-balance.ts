import { CHARACTER_ID } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  "the character's view has requested the wallet balance",
  async function () {
    await this.views.character!.character(CHARACTER_ID).wallet.get();
  },
);
