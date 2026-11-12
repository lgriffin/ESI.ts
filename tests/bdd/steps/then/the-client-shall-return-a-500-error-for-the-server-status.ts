import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 500 error for the server status', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(500);
  // 500 is not retried.
  expect(sentRequests()).toHaveLength(1);
});
