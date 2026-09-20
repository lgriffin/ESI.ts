import { EsiError } from '../../../../src/core/util/error';
import { routeRequest } from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a 404 error for the route', function () {
  expect(this.error).toBeInstanceOf(EsiError);
  expect((this.error as EsiError).statusCode).toBe(404);
  expect((this.error as EsiError).isNotFound()).toBe(true);
  // 404 is not retried, and POST is never retried.
  expect(sentRequests()).toHaveLength(1);
  const { request } = routeRequest();
  expect(request.method).toBe('POST');
});
