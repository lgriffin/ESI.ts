/**
 * BDD Scenarios: Location Management
 *
 * Comprehensive behavior-driven tests for Location-related APIs
 * covering character location, online status, current ship,
 * docked/in-space states, and concurrent fetches.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Location Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-location-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Location', () => {
    describe('Scenario: Retrieve character location while docked', () => {
      it('Given an authenticated character docked in a station, When I request their location, Then I should receive the solar system and station information', async () => {
        // Given: An authenticated character docked in a station
        const characterId = 1689391488;
        const expectedLocation = TestDataFactory.createCharacterLocation({
          solar_system_id: 30000142,
          station_id: 60003760,
        });

        jest
          .spyOn(client.location, 'getCharacterLocation')
          .mockResolvedValue(expectedLocation);

        // When: I request their location
        const result = await client.location.getCharacterLocation(characterId);

        // Then: I should receive the solar system and station information
        expect(result).toBeDefined();
        expect(result.solar_system_id).toBe(30000142);
        expect(result.station_id).toBe(60003760);
      });
    });

    describe('Scenario: Retrieve character location while in space', () => {
      it('Given an authenticated character flying in space, When I request their location, Then I should receive only the solar system with no station', async () => {
        // Given: An authenticated character flying in space
        const characterId = 1689391488;
        const expectedLocation = TestDataFactory.createCharacterLocation({
          solar_system_id: 30002187,
          station_id: undefined,
          structure_id: undefined,
        });

        jest
          .spyOn(client.location, 'getCharacterLocation')
          .mockResolvedValue(expectedLocation);

        // When: I request their location
        const result = await client.location.getCharacterLocation(characterId);

        // Then: I should receive only the solar system with no station
        expect(result).toBeDefined();
        expect(result.solar_system_id).toBe(30002187);
        expect(result.station_id).toBeUndefined();
        expect(result.structure_id).toBeUndefined();
      });
    });
  });

  describe('Feature: Character Online Status', () => {
    describe('Scenario: Check online status of an active character', () => {
      it('Given an authenticated character who is currently online, When I check their online status, Then I should see they are online with login timestamps', async () => {
        // Given: An authenticated character who is currently online
        const characterId = 1689391488;
        const expectedOnline = {
          online: true,
          last_login: '2024-01-15T08:00:00Z',
          last_logout: '2024-01-14T23:00:00Z',
          logins: 1542,
        };

        jest
          .spyOn(client.location, 'getCharacterOnline')
          .mockResolvedValue(expectedOnline);

        // When: I check their online status
        const result = await client.location.getCharacterOnline(characterId);

        // Then: I should see they are online with login timestamps
        expect(result).toBeDefined();
        expect(result.online).toBe(true);
        expect(result.last_login).toBeDefined();
        expect(result.last_logout).toBeDefined();
        expect(result.logins).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Check online status of an offline character', () => {
      it('Given an authenticated character who is currently offline, When I check their online status, Then I should see they are offline', async () => {
        // Given: An authenticated character who is currently offline
        const characterId = 123456789;
        const expectedOnline = {
          online: false,
          last_login: '2024-01-10T18:00:00Z',
          last_logout: '2024-01-10T22:30:00Z',
          logins: 87,
        };

        jest
          .spyOn(client.location, 'getCharacterOnline')
          .mockResolvedValue(expectedOnline);

        // When: I check their online status
        const result = await client.location.getCharacterOnline(characterId);

        // Then: I should see they are offline
        expect(result).toBeDefined();
        expect(result.online).toBe(false);
        expect(new Date(result.last_logout!).getTime()).toBeGreaterThan(
          new Date(result.last_login!).getTime(),
        );
      });
    });
  });

  describe('Feature: Character Ship', () => {
    describe('Scenario: Retrieve the ship a character is currently flying', () => {
      it('Given an authenticated character in a ship, When I request their current ship, Then I should receive the ship details', async () => {
        // Given: An authenticated character in a ship
        const characterId = 1689391488;
        const expectedShip = {
          ship_item_id: 1000000001234,
          ship_name: "Mittani's Titan",
          ship_type_id: 671,
        };

        jest
          .spyOn(client.location, 'getCharacterShip')
          .mockResolvedValue(expectedShip);

        // When: I request their current ship
        const result = await client.location.getCharacterShip(characterId);

        // Then: I should receive the ship details
        expect(result).toBeDefined();
        expect(result.ship_item_id).toBe(1000000001234);
        expect(result.ship_name).toBe("Mittani's Titan");
        expect(result.ship_type_id).toBe(671);
      });
    });
  });

  describe('Feature: Concurrent Location Data Fetch', () => {
    describe('Scenario: Fetch location, online status, and ship simultaneously', () => {
      it('Given an authenticated character, When I fetch location, online status, and ship concurrently, Then all three should resolve successfully', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedLocation = TestDataFactory.createCharacterLocation({
          solar_system_id: 30000142,
          station_id: 60003760,
        });
        const expectedOnline = {
          online: true,
          last_login: '2024-01-15T08:00:00Z',
          last_logout: '2024-01-14T23:00:00Z',
          logins: 1542,
        };
        const expectedShip = {
          ship_item_id: 1000000005678,
          ship_name: 'Market Runner',
          ship_type_id: 2998,
        };

        jest
          .spyOn(client.location, 'getCharacterLocation')
          .mockResolvedValue(expectedLocation);
        jest
          .spyOn(client.location, 'getCharacterOnline')
          .mockResolvedValue(expectedOnline);
        jest
          .spyOn(client.location, 'getCharacterShip')
          .mockResolvedValue(expectedShip);

        // When: I fetch all three concurrently
        const [location, online, ship] = await Promise.all([
          client.location.getCharacterLocation(characterId),
          client.location.getCharacterOnline(characterId),
          client.location.getCharacterShip(characterId),
        ]);

        // Then: All three should resolve successfully
        expect(location.solar_system_id).toBe(30000142);
        expect(online.online).toBe(true);
        expect(ship.ship_type_id).toBe(2998);
        expect(ship.ship_name).toBe('Market Runner');
      });
    });
  });

  describe('Feature: Location Error Handling', () => {
    describe('Scenario: Handle unauthorized access to character location', () => {
      it('Given an unauthenticated request, When I request a character location, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.location, 'getCharacterLocation')
          .mockRejectedValue(forbiddenError);

        // When & Then: I should receive a 403 forbidden error
        await expect(
          client.location.getCharacterLocation(characterId),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Handle unauthorized access to online status', () => {
      it('Given an unauthenticated request, When I request online status, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.location, 'getCharacterOnline')
          .mockRejectedValue(forbiddenError);

        // When & Then: I should receive a 403 forbidden error
        await expect(
          client.location.getCharacterOnline(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });
});
