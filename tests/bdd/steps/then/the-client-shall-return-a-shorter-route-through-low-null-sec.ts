import { AMARR, JITA, routeFixtures, routeRequest } from '../../support/route';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

// A regular expression: the "/" in the step text is alternation in a
// Cucumber Expression, and this step means it literally.
Then(
  /^the client shall return a shorter route through low\/null-sec$/,
  function () {
    expect(sentRequests()).toHaveLength(1);
    const { request, body } = routeRequest();
    expect(request.method).toBe('POST');
    expect(body).toEqual({ preference: 'LessSecure' });

    expect(this.result).toEqual(routeFixtures.insecureRoute());
    expect(this.result[0]).toBe(JITA);
    expect(this.result[this.result.length - 1]).toBe(AMARR);
  },
);
