import { Then } from '../../support/steps';

Then(
  'no export of the full SDE entry point other than SdeDataProvider shall be missing from the memory entry point',
  function () {
    expect(this.result.missingFromMemory).toEqual([]);
  },
);
