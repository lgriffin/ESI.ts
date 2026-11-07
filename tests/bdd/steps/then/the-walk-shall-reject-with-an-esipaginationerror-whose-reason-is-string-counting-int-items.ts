import { EsiPaginationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then(
  'the walk shall reject with an EsiPaginationError whose reason is {string} counting {int} items',
  function (reason: string, items: number) {
    expect(this.error).toBeInstanceOf(EsiPaginationError);
    const error = this.error as EsiPaginationError;
    expect(error.reason).toBe(reason);
    expect(error.itemCount).toBe(items);
    expect(error.partial).toEqual([]);
  },
);
