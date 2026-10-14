import { writeHostileArchive } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given(
  'a ZIP archive holding entries named {string} and {string} beside {string}',
  function (first: string, second: string, benign: string) {
    writeHostileArchive(this, [first, second], benign);
  },
);
