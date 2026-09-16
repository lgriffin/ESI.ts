import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 403 forbidden error for mail', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(403);
  // 403 is not retryable: one request, no second attempt.
  expect(sentRequests()).toHaveLength(1);
});
