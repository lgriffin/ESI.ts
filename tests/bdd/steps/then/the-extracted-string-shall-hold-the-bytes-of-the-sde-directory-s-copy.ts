import { Then } from '../../support/steps';
import { extractedMatchesSource } from '../../support/sdeFiles';

Then(
  "the extracted {string} shall hold the bytes of the SDE directory's copy",
  function (name: string) {
    expect(extractedMatchesSource(this, name)).toBe(true);
  },
);
