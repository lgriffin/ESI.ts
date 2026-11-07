import { storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the stored token for character {int} shall have the owner hash {string}',
  async function (characterId: number, ownerHash: string) {
    expect((await storedToken(this, characterId)).ownerHash).toBe(ownerHash);
  },
);
