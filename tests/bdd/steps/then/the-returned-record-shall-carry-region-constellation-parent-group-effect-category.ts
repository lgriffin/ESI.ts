import { Then } from '../../support/steps';

// The foreign key a record carries back into the map or the tree.
Then(
  /^the returned record shall carry (region|constellation|parent group|effect category) (\d+)$/,
  function (link: string, id: string) {
    const field = {
      region: 'regionId',
      constellation: 'constellationId',
      'parent group': 'parentGroupId',
      'effect category': 'effectCategoryId',
    }[link];
    expect(this.result[field!]).toBe(Number(id));
  },
);
