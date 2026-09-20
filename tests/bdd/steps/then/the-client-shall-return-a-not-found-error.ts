import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a not found error', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(404);
  // 404 is not retryable: one request, one rejection.
  expect(sentRequests()).toHaveLength(1);
});
