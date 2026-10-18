import { viewOf } from '../../support/identity-views';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the identity view follows every page of the character's assets",
  async function () {
    this.result = await viewOf(this).assets.getCharacterAssets(CHARACTER_ID);
  },
);
