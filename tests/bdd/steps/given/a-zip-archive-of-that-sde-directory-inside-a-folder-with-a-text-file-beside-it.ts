import { Given } from '../../support/steps';
import { zipSdeDirectoryInFolder } from '../../support/sdeFiles';

Given(
  'a ZIP archive of that SDE directory inside a folder, with a text file beside it',
  function () {
    zipSdeDirectoryInFolder(this, 'sde');
  },
);
