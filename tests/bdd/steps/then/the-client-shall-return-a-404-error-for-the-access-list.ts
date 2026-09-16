import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 404 error for the access list', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(404);
  // 404 is not retryable: exactly one request reaches ESI.
  expect(sentRequests()).toHaveLength(1);
});
