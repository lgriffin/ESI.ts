import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { tokenFilePath } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given('a file token storage', function () {
  this.values.fileStorage = new FileTokenStorage(tokenFilePath(this));
});
