import { Given } from '../../support/steps';
import { EXTENDED_SDE_FILES, writeSdeDirectory } from '../../support/sdeFiles';

Given(
  'an SDE directory holding the raw export files, market groups and translation languages',
  function () {
    writeSdeDirectory(this, EXTENDED_SDE_FILES);
  },
);
