import { EsiError } from '../../../../src/core/util/error';
import { RETRYABLE_ATTEMPTS, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 503 error for cosmetics', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(503);
  expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
});
