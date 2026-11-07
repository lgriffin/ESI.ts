import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { tokenFilePath } from '../../support/token-storage';
import { When } from '../../support/steps';

When(
  'a file token storage is built with the lock {word} {word}',
  function (timing: string, value: string) {
    try {
      new FileTokenStorage(tokenFilePath(this), {
        lock: { [timing]: Number(value) },
      });
    } catch (err: unknown) {
      this.error = err;
    }
  },
);
