import { Given } from '../../support/steps';
import { SCHEMA_SDE_FILES, writeSdeDirectory } from '../../support/sdeFiles';

Given('an SDE directory holding the schema export files', function () {
  writeSdeDirectory(this, SCHEMA_SDE_FILES);
});
