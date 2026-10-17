import { Then } from '../../support/steps';

Then(
  "the items shall be the character's two assets as ESI sent them",
  function () {
    expect(this.result).toEqual([{ item_id: 1 }, { item_id: 2 }]);
  },
);
