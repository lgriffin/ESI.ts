import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { makeStoredToken } from '../../step-definitions/shared/sso-helpers';
import { tokenFilePath } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given(
  'a file token storage with locking holding characters {int} and {int}',
  async function (first: number, second: number) {
    const storage = new FileTokenStorage(tokenFilePath(this), { lock: true });
    this.values.fileStorage = storage;
    for (const id of [first, second]) {
      await storage.set(id, makeStoredToken({ characterId: id }));
    }
  },
);
