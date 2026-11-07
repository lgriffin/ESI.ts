import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { tokenFilePath } from '../../support/token-storage';
import { attempt } from '../../support/token-manager';
import { When } from '../../support/steps';

When('a file token storage reads the file', async function () {
  await attempt(this, () => new FileTokenStorage(tokenFilePath(this)).list());
});
