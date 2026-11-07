import { storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the stored token for character {int} shall have the access token {string} and the name {string}',
  async function (
    characterId: number,
    accessToken: string,
    characterName: string,
  ) {
    expect(await storedToken(this, characterId)).toMatchObject({
      accessToken,
      characterName,
    });
  },
);
