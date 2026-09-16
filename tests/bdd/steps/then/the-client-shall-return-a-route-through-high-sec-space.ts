import {
  AMARR,
  JITA,
  routeFixtures,
  routePaths,
  routeRequest,
} from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a route through high-sec space', function () {
  expect(sentRequests()).toHaveLength(1);
  const { request, body } = routeRequest();
  expect(request.method).toBe('POST');
  expect(request.url.pathname).toContain(routePaths.route(JITA, AMARR));
  expect(body).toEqual({ preference: 'Safer' });

  expect(this.result).toEqual(routeFixtures.secureRoute());
  expect(this.result[0]).toBe(JITA);
  expect(this.result[this.result.length - 1]).toBe(AMARR);
});
