import { EsiPaginationError } from '../../../../src/core/util/error';
import { servedEntriesOfPages } from '../../support/paging-helpers';
import { Then } from '../../support/steps';

Then(
  'the walk shall reject with an EsiPaginationError whose reason is {string} carrying the entries of pages {int} to {int}',
  function (reason: string, from: number, to: number) {
    expect(this.error).toBeInstanceOf(EsiPaginationError);
    const error = this.error as EsiPaginationError;
    const entries = servedEntriesOfPages(this, from, to);
    expect(error.reason).toBe(reason);
    expect(error.partial).toEqual(entries);
    expect(error.itemCount).toBe(entries.length);
  },
);
