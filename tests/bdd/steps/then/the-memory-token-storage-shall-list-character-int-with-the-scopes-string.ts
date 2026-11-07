import { Then } from '../../support/steps';

Then(
  'the memory token storage shall list character {int} with the scopes {string}',
  async function (characterId: number, scopes: string) {
    const tokens = await this.values.memoryStorage.list();
    expect(
      tokens.map((t: { characterId: number; scopes: string[] }) => [
        t.characterId,
        t.scopes,
      ]),
    ).toEqual([[characterId, scopes.split(' ')]]);
  },
);
