import { When } from '../../support/steps';
import { listArchiveFiles } from '../../support/sdeFiles';

When('I list the YAML files in the archive', function () {
  listArchiveFiles(this);
});
