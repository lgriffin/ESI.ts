import { listedCharacter } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the character list shall hold character {int}, revoked',
  function (characterId: number) {
    expect(listedCharacter(this, characterId).revoked).toBe(true);
  },
);
