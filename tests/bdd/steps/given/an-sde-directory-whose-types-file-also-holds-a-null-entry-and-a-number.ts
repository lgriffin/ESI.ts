import { Given } from '../../support/steps';
import {
  NON_RECORD_SDE_FILES,
  writeSdeDirectory,
} from '../../support/sdeFiles';

Given(
  'an SDE directory whose types file also holds a null entry and a number',
  function () {
    writeSdeDirectory(this, NON_RECORD_SDE_FILES);
  },
);
