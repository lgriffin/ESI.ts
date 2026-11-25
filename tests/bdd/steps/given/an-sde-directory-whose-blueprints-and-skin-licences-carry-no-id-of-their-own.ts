import { Given } from '../../support/steps';
import {
  KEY_ONLY_ID_SDE_FILES,
  writeSdeDirectory,
} from '../../support/sdeFiles';

Given(
  'an SDE directory whose blueprints and SKIN licences carry no ID of their own',
  function () {
    writeSdeDirectory(this, KEY_ONLY_ID_SDE_FILES);
  },
);
