import { EsiPaginationError } from '../../../../src/core/util/error';
import { firstProject } from '../../support/paging';
import { Then } from '../../support/steps';

Then(
  'the cursor walk shall reject with an EsiPaginationError whose reason is {string} carrying the first project',
  function (reason: string) {
    expect(this.error).toBeInstanceOf(EsiPaginationError);
    const error = this.error as EsiPaginationError;
    expect(error.reason).toBe(reason);
    expect(error.partial).toEqual([firstProject]);
    expect((error.cause as Error).message).toBe('socket closed');
  },
);
