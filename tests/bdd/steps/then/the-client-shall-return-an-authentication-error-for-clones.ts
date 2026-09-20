import { EsiError } from '../../../../src/core/util/error';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an authentication error for clones', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(403);
  expect((this.error as EsiError).message).toContain('token is expired');
  expect(sentRequests()).toHaveLength(1);
});
