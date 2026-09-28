import { Given } from '../../support/steps';
import { writeSdeDirectory } from '../../support/sdeFiles';

Given('an SDE directory holding the raw export files', function () {
  writeSdeDirectory(this);
});
