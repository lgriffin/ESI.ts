import { EsiError } from '../../../../src/core/util/error';
import { expectSearchRequest, searchQueries } from '../../support/search';
import { Then } from '../../support/steps';

Then('the client shall return a 403 search error', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(403);
  expect((this.error as EsiError).isForbidden()).toBe(true);
  // 403 is not retried.
  expectSearchRequest(searchQueries.forbidden, ['character']);
});
