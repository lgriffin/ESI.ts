import { Then } from '../../support/steps';
import { extractedFiles } from '../../support/sdeFiles';

Then('the extraction directory shall hold no file', function () {
  expect(extractedFiles(this)).toEqual([]);
});
