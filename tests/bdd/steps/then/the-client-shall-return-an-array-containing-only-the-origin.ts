import { JITA, routePaths, routeRequest } from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return an array containing only the origin',
  function () {
    expect(sentRequests()).toHaveLength(1);
    const { request } = routeRequest();
    expect(request.url.pathname).toContain(routePaths.route(JITA, JITA));
    expect(this.result).toEqual([JITA]);
  },
);
