import { When } from '../../support/steps';
import { extractArchive } from '../../support/sdeFiles';

When('I extract the archive to that directory', function () {
  extractArchive(this);
});
