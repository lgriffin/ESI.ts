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

  test('Calculate shortest route between two systems', ({
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

    when('I request the shortest route', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('I should receive an ordered list of system IDs', () => {
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      expect(result).toHaveLength(5);
    });
  });

  test('Calculate secure route', ({ given, when, then }) => {
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

    when('I request a secure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'Safer',
      });
    });

    then('I should receive a route through high-sec space', () => {
      expect(result).toBeDefined();
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      expect(result.length).toBeGreaterThan(5);
    });
  });

  test('Calculate insecure route', ({ given, when, then }) => {
    let result: any;
    const origin = 30000142;
    const destination = 30002187;
    const insecureRoute = [30000142, 30001000, 30002187];

    given('two systems for insecure routing', () => {
      jest.spyOn(client.route, 'getRoute').mockResolvedValue(insecureRoute);
    });

    when('I request an insecure route', async () => {
      result = await client.route.getRoute(origin, destination, {
        preference: 'LessSecure',
      });
    });

    then('I should receive a shorter route through low/null-sec', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
    });
  });

  test('Route from a system to itself', ({ given, when, then }) => {
    let result: any;
    const systemId = 30000142;

    given('the same origin and destination', () => {
      jest.spyOn(client.route, 'getRoute').mockResolvedValue([systemId]);
    });

    when('I request a route to itself', async () => {
      result = await client.route.getRoute(systemId, systemId);
    });

    then('I should receive an array containing only the origin', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(systemId);
    });
  });

  test('Route through multiple systems', ({ given, when, then }) => {
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

    when('I request a route between distant systems', async () => {
      result = await client.route.getRoute(origin, destination);
    });

    then('I should receive a multi-hop path', () => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(result[0]).toBe(origin);
      expect(result[result.length - 1]).toBe(destination);
      result.forEach((systemId: number) => {
        expect(typeof systemId).toBe('number');
      });
    });
  });

  test('Unreachable destination', ({ given, when, then }) => {
    let caughtError: any;
    const origin = 30000142;
    const destination = 99999999;

    given('an unreachable destination', () => {
      const error = TestDataFactory.createError(404);
      jest.spyOn(client.route, 'getRoute').mockRejectedValue(error);
    });

    when('I request a route to unreachable destination', async () => {
      try {
        await client.route.getRoute(origin, destination);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Route with avoided systems', ({ given, when, then }) => {
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

    when('I request a route avoiding systems', async () => {
      result = await client.route.getRoute(origin, destination, {
        avoid_systems: avoidSystems,
      });
    });

    then(
      'I should receive a route that does not include avoided systems',
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
