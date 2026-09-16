import {
  AMARR,
  AVOIDED_SYSTEM_IDS,
  JITA,
  routeFixtures,
  routeRequest,
} from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return a route that does not include avoided systems',
  function () {
    expect(sentRequests()).toHaveLength(1);
    const { request, body } = routeRequest();
    expect(request.method).toBe('POST');
    expect(body).toEqual({ avoid_systems: [30000144, 30000146] });

    expect(this.result).toEqual(routeFixtures.routeAvoidingSystems());
    expect(this.result[0]).toBe(JITA);
    expect(this.result[this.result.length - 1]).toBe(AMARR);
    AVOIDED_SYSTEM_IDS.forEach((avoided) => {
      expect(this.result).not.toContain(avoided);
    });
  },
);
