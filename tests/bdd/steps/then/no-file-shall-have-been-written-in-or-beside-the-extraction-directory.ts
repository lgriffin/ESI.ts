import { filesWrittenAroundExtraction } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then(
  'no file shall have been written in or beside the extraction directory',
  function () {
    expect(filesWrittenAroundExtraction(this)).toEqual([]);
  },
);
