import { ASSET_PAGE } from '../../support/mock-transport';
import { Then } from '../../support/steps';

Then(
  "the items shall be the character's two assets as ESI sent them",
  function () {
    expect(this.result).toEqual([
      ASSET_PAGE[0],
      { ...ASSET_PAGE[0], item_id: 2 },
    ]);
  },
);
