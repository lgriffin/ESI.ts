import { Given } from '../../support/steps';
import {
  RAW_SDE_FILES,
  UNREGISTERED_INVALID_YAML,
  writeSdeDirectory,
} from '../../support/sdeFiles';

Given(
  'an SDE directory holding the raw export files and an unregistered file that is not valid YAML',
  function () {
    writeSdeDirectory(this, {
      ...RAW_SDE_FILES,
      ...UNREGISTERED_INVALID_YAML,
    });
  },
);
