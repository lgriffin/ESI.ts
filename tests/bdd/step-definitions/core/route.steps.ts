import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/route.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN calculating shortest route between two systems, the client shall return the result', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const expectedRoute = [30000142, 30000144, 30000148, 30002813, 30002187];

    given('two solar system IDs', () => {
      jest.spyOn(client.route, 'getRoute').mockResolvedValue(expectedRoute);
    });

    when('the client requests the shortest route', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('the client shall return an ordered list of system IDs', () => {
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      expect(result).toHaveLength(5);
    });
  });

  test('WHEN calculating secure route, the client shall return the result', ({
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
      jest.spyOn(client.route, 'getRoute').mockResolvedValue(secureRoute);
    });

    when('the client requests a secure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'Safer',
      });
    });

    then('the client shall return a route through high-sec space', () => {
      expect(result).toBeDefined();
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      expect(result.length).toBeGreaterThan(5);
    });
  });

  test('WHEN calculating insecure route, the client shall return the result', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const insecureRoute = [30000142, 30001000, 30002187];

    given('two systems for insecure routing', () => {
      jest.spyOn(client.route, 'getRoute').mockResolvedValue(insecureRoute);
    });

    when('the client requests an insecure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'LessSecure',
      });
    });

    then('the client shall return a shorter route through low/null-sec', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
    });
  });

  test('WHEN routing from a system to itself, the client shall return a single-system route', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const systemId = 30000142;

    given('the same origin and destination', () => {
      jest.spyOn(client.route, 'getRoute').mockResolvedValue([systemId]);
    });

    when('the client requests a route to itself', async () => {
      result = await client.route.getRoute(systemId, systemId);
    });

    then('the client shall return an array containing only the origin', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(systemId);
    });
  });

  test('WHEN routing through multiple systems, the client shall return multi-hop waypoints', ({
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
      jest.spyOn(client.route, 'getRoute').mockResolvedValue(longRoute);
    });

    when('the client requests a route between distant systems', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('the client shall return a multi-hop path', () => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      result.forEach((systemId: number) => {
        expect(typeof systemId).toBe('number');
      });
    });
  });

  test('IF the destination is unreachable, THEN the client shall return an error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const origin = 30000142;
    const destination = 99999999;

    given('an unreachable destination', () => {
      const error = TestDataFactory.createError(404);
      jest.spyOn(client.route, 'getRoute').mockRejectedValue(error);
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
    });
  });

  test('WHEN routing with avoided systems, the client shall exclude them from the path', ({
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
      jest
        .spyOn(client.route, 'getRoute')
        .mockResolvedValue(routeAvoidingSystems);
    });

    when('the client requests a route avoiding systems', async () => {
      result = await client.route.getRoute(origin, destination, {
        avoid_systems: avoidSystems,
      });
    });

    then(
      'the client shall return a route that does not include avoided systems',
      () => {
        expect(result).toBeDefined();
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        avoidSystems.forEach((avoided) => {
          expect(result).not.toContain(avoided);
        });
      },
    );
  });
});
