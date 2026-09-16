import { EsiError } from '../../../../src/core/util/error';
import { EXPIRED_ACCESS_TOKEN } from '../../support/access-lists';
import { lastRequest, sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 401 error', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(401);
  expect(sentRequests()).toHaveLength(1);
  expect(lastRequest().headers.authorization).toBe(
    `Bearer ${EXPIRED_ACCESS_TOKEN}`,
  );
});
