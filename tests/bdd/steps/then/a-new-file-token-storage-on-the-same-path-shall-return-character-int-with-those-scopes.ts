import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { tokenFilePath } from '../../support/token-storage';
import { Then } from '../../support/steps';

Then(
  'a new file token storage on the same path shall return character {int} with those scopes',
  async function (characterId: number) {
    const stored = await new FileTokenStorage(tokenFilePath(this)).get(
      characterId,
    );
    expect(stored?.scopes).toEqual(this.values.writtenScopes);
  },
);
