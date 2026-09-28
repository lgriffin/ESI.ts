import { When } from '../../support/steps';
import { openSdeDirectory } from '../../support/sdeFiles';

When('I open the SDE from the directory', function () {
  openSdeDirectory(this);
});
