import { idsOf } from '../../support/token-storage';
import { Then } from '../../support/steps';

Then(
  'the file token storage shall return only character {int}',
  function (characterId: number) {
    expect(this.error).toBeUndefined();
    expect(idsOf(this.result)).toEqual([characterId]);
  },
);
