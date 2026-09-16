import { AMARR, JITA, routeFixtures, routeRequest } from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return an ordered list of system IDs', function () {
  expect(sentRequests()).toHaveLength(1);
  const { request, body } = routeRequest();
  expect(request.method).toBe('POST');
  expect(request.url.pathname).toMatch(
    new RegExp(`/route/${JITA}/${AMARR}/?$`),
  );
  expect(body).toEqual({});

  expect(this.result).toEqual(routeFixtures.shortestRoute());
  expect(this.result[0]).toBe(JITA);
  expect(this.result[this.result.length - 1]).toBe(AMARR);
});
