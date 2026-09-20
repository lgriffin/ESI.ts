import { EsiError } from '../../../../src/core/util/error';
import { RETRYABLE_ATTEMPTS, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a service unavailable error', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(503);
  expect((this.error as EsiError).message).toContain('Service Unavailable');
  expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
});
