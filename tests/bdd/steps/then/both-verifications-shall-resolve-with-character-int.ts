import { Then } from '../../support/steps';

Then(
  'both verifications shall resolve with character {int}',
  function (characterId: number) {
    expect(
      this.result.map((r: { characterId: number }) => r.characterId),
    ).toEqual([characterId, characterId]);
  },
);
