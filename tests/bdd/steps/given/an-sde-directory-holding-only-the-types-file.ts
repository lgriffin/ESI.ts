import { Given } from '../../support/steps';
import { RAW_SDE_FILES, writeSdeDirectory } from '../../support/sdeFiles';

Given('an SDE directory holding only the types file', function () {
  writeSdeDirectory(this, { 'types.yaml': RAW_SDE_FILES['types.yaml'] });
});
