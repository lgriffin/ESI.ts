import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { idsOf, tokenFilePath } from '../../support/token-storage';
import { Then } from '../../support/steps';

Then(
  'a new file token storage on the same path shall hold only character {int}',
  async function (characterId: number) {
    const tokens = await new FileTokenStorage(tokenFilePath(this)).list();
    expect(idsOf(tokens)).toEqual([characterId]);
  },
);
