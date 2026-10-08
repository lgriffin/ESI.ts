import { Given } from '../../support/steps';
import { extractionDirectoryHolding } from '../../support/sdeFiles';

Given(
  'an extraction directory already holding {string} reading {string}',
  function (name: string, content: string) {
    extractionDirectoryHolding(this, name, content);
  },
);
