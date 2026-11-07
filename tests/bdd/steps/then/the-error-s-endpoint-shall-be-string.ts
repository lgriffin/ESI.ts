import type { EsiPaginationError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then("the error's endpoint shall be {string}", function (endpoint: string) {
  expect((this.error as EsiPaginationError).endpoint).toBe(endpoint);
});
