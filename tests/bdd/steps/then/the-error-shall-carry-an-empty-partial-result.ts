import type { EsiPaginationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the error shall carry an empty partial result', function () {
  expect((this.error as EsiPaginationError).partial).toEqual([]);
});
