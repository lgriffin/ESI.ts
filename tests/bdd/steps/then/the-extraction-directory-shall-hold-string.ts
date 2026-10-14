import { Then } from '../../support/steps';
import { extractedFiles } from '../../support/sdeFiles';

Then('the extraction directory shall hold {string}', function (names: string) {
  expect(extractedFiles(this)).toEqual(
    names.split(',').map((name) => name.trim()),
  );
});
