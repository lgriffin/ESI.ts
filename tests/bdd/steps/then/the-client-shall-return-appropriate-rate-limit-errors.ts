import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return appropriate rate limit errors', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(429);
  expect((this.error as EsiError).isRateLimited()).toBe(true);
  expect(sentRequests()).toHaveLength(1);
});
