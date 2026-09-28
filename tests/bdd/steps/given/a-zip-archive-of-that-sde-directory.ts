import { Given } from '../../support/steps';
import { zipSdeDirectory } from '../../support/sdeFiles';

Given('a ZIP archive of that SDE directory', function () {
  zipSdeDirectory(this);
});
