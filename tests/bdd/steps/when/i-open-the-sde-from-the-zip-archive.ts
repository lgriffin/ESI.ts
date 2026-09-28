import { When } from '../../support/steps';
import { openSdeArchive } from '../../support/sdeFiles';

When('I open the SDE from the ZIP archive', function () {
  openSdeArchive(this);
});
