import {
  CHARACTER_ID,
  identityOf,
  runtimeOf,
} from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  "the character's view in safe mode follows every page of the character's assets",
  async function () {
    const view = runtimeOf(this).withSafeMode().as(identityOf(this));
    const assets: unknown[] = [];
    for await (const asset of view.character(CHARACTER_ID).assets.get()) {
      assets.push(asset);
    }
    this.result = assets;
  },
);
