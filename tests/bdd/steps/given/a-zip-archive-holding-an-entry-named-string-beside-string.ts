import { writeHostileArchive } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given(
  'a ZIP archive holding an entry named {string} beside {string}',
  function (hostile: string, benign: string) {
    writeHostileArchive(this, hostile, benign);
  },
);
