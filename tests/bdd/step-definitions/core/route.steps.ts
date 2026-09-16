import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RecordedRequest,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0029-route.feature');

/** The single POST the Route client sent, with its JSON body parsed. */
function routeRequest(): { request: RecordedRequest; body: unknown } {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  return {
    request,
    body: request.body === undefined ? undefined : JSON.parse(request.body),
  };
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Five-system route between two known systems', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const expectedRoute = [30000142, 30000144, 30000148, 30002813, 30002187];

    given('two solar system IDs', () => {
      queueResponse({
        match: `/route/${origin}/${destination}`,
        body: { route: expectedRoute },
      });
    });

    when('the client requests the shortest route', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('the client shall return an ordered list of system IDs', () => {
      const { request, body } = routeRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toMatch(
        new RegExp(`/route/${origin}/${destination}/?$`),
      );
      expect(body).toEqual({});

      expect(result).toEqual(expectedRoute);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
    });
  });

  test('Safer preference returns a longer high-security path', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const secureRoute = [
      30000142, 30000144, 30000146, 30000150, 30000155, 30000160, 30002500,
      30002600, 30002187,
    ];

    given('two systems for secure routing', () => {
      queueResponse({
        match: `/route/${origin}/${destination}`,
        body: { route: secureRoute },
      });
    });

    when('the client requests a secure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'Safer',
      });
    });

    then('the client shall return a route through high-sec space', () => {
      const { request, body } = routeRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toContain(`/route/${origin}/${destination}`);
      expect(body).toEqual({ preference: 'Safer' });

      expect(result).toEqual(secureRoute);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
    });
  });

  test('LessSecure preference returns a three-system path', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const insecureRoute = [30000142, 30001000, 30002187];

    given('two systems for insecure routing', () => {
      queueResponse({
        match: `/route/${origin}/${destination}`,
        body: { route: insecureRoute },
      });
    });

    when('the client requests an insecure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'LessSecure',
      });
    });

    then('the client shall return a shorter route through low/null-sec', () => {
      const { request, body } = routeRequest();
      expect(request.method).toBe('POST');
      expect(body).toEqual({ preference: 'LessSecure' });

      expect(result).toEqual(insecureRoute);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
    });
  });

  test('Route from a system to itself contains that system alone', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const systemId = 30000142;

    given('the same origin and destination', () => {
      queueResponse({
        match: `/route/${systemId}/${systemId}`,
        body: { route: [systemId] },
      });
    });

    when('the client requests a route to itself', async () => {
      result = await client.route.getRoute(systemId, systemId);
    });

    then('the client shall return an array containing only the origin', () => {
      const { request } = routeRequest();
      expect(request.url.pathname).toContain(`/route/${systemId}/${systemId}`);
      expect(result).toEqual([systemId]);
    });
  });

  test('Fifteen-hop route across the map returns numeric system IDs', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30004759;
    const longRoute = [
      30000142, 30000144, 30000148, 30000200, 30000250, 30000300, 30000400,
      30000500, 30001000, 30002000, 30003000, 30004000, 30004500, 30004700,
      30004759,
    ];

    given('distant systems', () => {
      queueResponse({
        match: `/route/${origin}/${destination}`,
        body: { route: longRoute },
      });
    });

    when('the client requests a route between distant systems', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('the client shall return a multi-hop path', () => {
      const { request } = routeRequest();
      expect(request.url.pathname).toContain(`/route/${origin}/${destination}`);

      expect(result).toEqual(longRoute);
      expect(result).toHaveLength(15);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      result.forEach((systemId: number) => {
        expect(typeof systemId).toBe('number');
      });
    });
  });

  test('Unreachable destination is rejected with 404', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const origin = 30000142;
    const destination = 99999999;

    given('an unreachable destination', () => {
      queueError(404, 'No route found', {
        match: `/route/${origin}/${destination}`,
      });
    });

    when('the client requests a route to unreachable destination', async () => {
      try {
        await client.route.getRoute(origin, destination);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect((caughtError as EsiError).isNotFound()).toBe(true);
      // 404 is not retried, and POST is never retried.
      const { request } = routeRequest();
      expect(request.method).toBe('POST');
    });
  });

  test('Route avoiding two systems omits both from the path', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const avoidSystems = [30000144, 30000146];
    const routeAvoidingSystems = [
      30000142, 30000149, 30000155, 30000200, 30002187,
    ];

    given('systems to avoid', () => {
      queueResponse({
        match: `/route/${origin}/${destination}`,
        body: { route: routeAvoidingSystems },
      });
    });

    when('the client requests a route avoiding systems', async () => {
      result = await client.route.getRoute(origin, destination, {
        avoid_systems: avoidSystems,
      });
    });

    then(
      'the client shall return a route that does not include avoided systems',
      () => {
        const { request, body } = routeRequest();
        expect(request.method).toBe('POST');
        expect(body).toEqual({ avoid_systems: [30000144, 30000146] });

        expect(result).toEqual(routeAvoidingSystems);
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        avoidSystems.forEach((avoided) => {
          expect(result).not.toContain(avoided);
        });
      },
    );
  });
});
