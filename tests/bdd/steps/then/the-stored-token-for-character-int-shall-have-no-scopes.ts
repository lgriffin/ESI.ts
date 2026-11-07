import { storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the stored token for character {int} shall have no scopes',
  async function (characterId: number) {
    expect((await storedToken(this, characterId)).scopes).toEqual([]);
  },
);
