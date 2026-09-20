import {
  DISTANT_SYSTEM_ID,
  JITA,
  routeFixtures,
  routePaths,
  routeRequest,
} from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a multi-hop path', function () {
  expect(sentRequests()).toHaveLength(1);
  const { request } = routeRequest();
  expect(request.url.pathname).toContain(
    routePaths.route(JITA, DISTANT_SYSTEM_ID),
  );

  expect(this.result).toEqual(routeFixtures.longRoute());
  expect(this.result).toHaveLength(15);
  expect(this.result[0]).toBe(JITA);
  expect(this.result[this.result.length - 1]).toBe(DISTANT_SYSTEM_ID);
  this.result.forEach((systemId: number) => {
    expect(typeof systemId).toBe('number');
  });
});
