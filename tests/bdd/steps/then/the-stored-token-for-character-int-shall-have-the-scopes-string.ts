import { storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the stored token for character {int} shall have the scopes {string}',
  async function (characterId: number, scopes: string) {
    expect((await storedToken(this, characterId)).scopes).toEqual(
      scopes.split(' '),
    );
  },
);
