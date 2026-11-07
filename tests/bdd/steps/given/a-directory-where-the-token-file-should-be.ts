import { mkdirSync } from 'fs';
import { tokenFilePath } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given('a directory where the token file should be', function () {
  mkdirSync(tokenFilePath(this));
});
