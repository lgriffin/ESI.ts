import { servedEntriesOfPages } from '../../support/paging-helpers';
import { Then } from '../../support/steps';

Then(
  'the walk shall resolve with the entries of pages {int} to {int}',
  function (from: number, to: number) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual(servedEntriesOfPages(this, from, to));
  },
);
