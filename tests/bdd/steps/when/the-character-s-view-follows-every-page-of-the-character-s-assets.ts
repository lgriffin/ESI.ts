import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the character's view follows every page of the character's assets",
  async function () {
    const assets = [];
    for await (const asset of this.views
      .character!.character(CHARACTER_ID)
      .assets.get()) {
      assets.push(asset);
    }
    this.result = assets;
  },
);
