import { Then } from '../../support/steps';

Then(
  'the verification shall resolve with character {int}',
  function (characterId: number) {
    expect(this.error).toBeUndefined();
    expect(this.result.characterId).toBe(characterId);
  },
);
