/**
 * BDD-Style Testing for Route API
 *
 * This demonstrates BDD principles for the Route API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Route Navigation Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Calculate Routes Between Systems', () => {
    describe('Scenario: Calculate shortest route between two systems', () => {
      it('Given two solar system IDs, When I request the shortest route, Then I should receive an ordered list of system IDs', async () => {
        // Given
        const origin = 30000142; // Jita
        const destination = 30002187; // Amarr
        const expectedRoute = [
          30000142, 30000144, 30000148, 30002813, 30002187,
        ];

        jest.spyOn(client.route, 'getRoute').mockResolvedValue(expectedRoute);

        // When
        const result = await client.route.getRoute(origin, destination);

        // Then
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        expect(result).toHaveLength(5);
      });
    });

    describe('Scenario: Calculate secure route', () => {
      it('Given two systems, When I request a secure route, Then I should receive a route through high-sec space', async () => {
        // Given
        const origin = 30000142; // Jita
        const destination = 30002187; // Amarr
        const secureRoute = [
          30000142, 30000144, 30000146, 30000150, 30000155, 30000160, 30002500,
          30002600, 30002187,
        ];

        jest.spyOn(client.route, 'getRoute').mockResolvedValue(secureRoute);

        // When
        const result = await client.route.getRoute(origin, destination, {
          preference: 'Safer',
        });

        // Then
        expect(result).toBeDefined();
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        expect(result.length).toBeGreaterThan(5);
      });
    });

    describe('Scenario: Calculate insecure route', () => {
      it('Given two systems, When I request an insecure route, Then I should receive a shorter route through low/null-sec', async () => {
        // Given
        const origin = 30000142; // Jita
        const destination = 30002187; // Amarr
        const insecureRoute = [30000142, 30001000, 30002187];

        jest.spyOn(client.route, 'getRoute').mockResolvedValue(insecureRoute);

        // When
        const result = await client.route.getRoute(origin, destination, {
          preference: 'LessSecure',
        });

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
      });
    });

    describe('Scenario: Route from a system to itself', () => {
      it('Given the same origin and destination, When I request a route, Then I should receive an array containing only the origin', async () => {
        // Given
        const systemId = 30000142; // Jita

        jest.spyOn(client.route, 'getRoute').mockResolvedValue([systemId]);

        // When
        const result = await client.route.getRoute(systemId, systemId);

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(systemId);
      });
    });

    describe('Scenario: Route through multiple systems', () => {
      it('Given distant systems, When I request a route, Then I should receive a multi-hop path', async () => {
        // Given
        const origin = 30000142;
        const destination = 30004759;
        const longRoute = [
          30000142, 30000144, 30000148, 30000200, 30000250, 30000300, 30000400,
          30000500, 30001000, 30002000, 30003000, 30004000, 30004500, 30004700,
          30004759,
        ];

        jest.spyOn(client.route, 'getRoute').mockResolvedValue(longRoute);

        // When
        const result = await client.route.getRoute(origin, destination);

        // Then
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(10);
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        result.forEach((systemId: number) => {
          expect(typeof systemId).toBe('number');
        });
      });
    });

    describe('Scenario: Unreachable destination', () => {
      it('Given an unreachable destination, When I request a route, Then I should receive a 404 error', async () => {
        // Given
        const origin = 30000142;
        const destination = 99999999;
        const error = TestDataFactory.createError(404);

        jest.spyOn(client.route, 'getRoute').mockRejectedValue(error);

        // When & Then
        await expect(
          client.route.getRoute(origin, destination),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Route with avoided systems', () => {
      it('Given systems to avoid, When I request a route, Then I should receive a route that does not include avoided systems', async () => {
        // Given
        const origin = 30000142;
        const destination = 30002187;
        const avoidSystems = [30000144, 30000146];
        const routeAvoidingSystems = [
          30000142, 30000149, 30000155, 30000200, 30002187,
        ];

        jest
          .spyOn(client.route, 'getRoute')
          .mockResolvedValue(routeAvoidingSystems);

        // When
        const result = await client.route.getRoute(origin, destination, {
          avoid_systems: avoidSystems,
        });

        // Then
        expect(result).toBeDefined();
        expect(result[0]).toBe(origin);
        expect(result[result.length - 1]).toBe(destination);
        avoidSystems.forEach((avoided) => {
          expect(result).not.toContain(avoided);
        });
      });
    });
  });
});
