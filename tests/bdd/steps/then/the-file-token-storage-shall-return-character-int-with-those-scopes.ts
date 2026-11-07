import { Then } from '../../support/steps';

Then(
  'the file token storage shall return character {int} with those scopes',
  async function (characterId: number) {
    const storage = this.values.fileStorage;
    expect((await storage.get(characterId))?.scopes).toEqual(
      this.values.writtenScopes,
    );
    const listed = await storage.list();
    expect(listed.map((t: { scopes: string[] }) => t.scopes)).toEqual([
      this.values.writtenScopes,
    ]);
  },
);
