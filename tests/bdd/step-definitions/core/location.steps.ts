import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/location.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-location-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Retrieve character location while docked', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character docked in a station', () => {
      const expectedLocation = TestDataFactory.createCharacterLocation({
        solar_system_id: 30000142,
        station_id: 60003760,
      });

      jest
        .spyOn(client.location, 'getCharacterLocation')
        .mockResolvedValue(expectedLocation);
    });

    when('I request their location', async () => {
      result = await client.location.getCharacterLocation(characterId);
    });

    then('I should receive the solar system and station information', () => {
      expect(result).toBeDefined();
      expect(result.solar_system_id).toBe(30000142);
      expect(result.station_id).toBe(60003760);
    });
  });

  test('Retrieve character location while in space', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character flying in space', () => {
      const expectedLocation = TestDataFactory.createCharacterLocation({
        solar_system_id: 30002187,
        station_id: undefined,
        structure_id: undefined,
      });

      jest
        .spyOn(client.location, 'getCharacterLocation')
        .mockResolvedValue(expectedLocation);
    });

    when('I request their location while in space', async () => {
      result = await client.location.getCharacterLocation(characterId);
    });

    then('I should receive only the solar system with no station', () => {
      expect(result).toBeDefined();
      expect(result.solar_system_id).toBe(30002187);
      expect(result.station_id).toBeUndefined();
      expect(result.structure_id).toBeUndefined();
    });
  });

  test('Check online status of an active character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character who is currently online', () => {
      const expectedOnline = {
        online: true,
        last_login: '2024-01-15T08:00:00Z',
        last_logout: '2024-01-14T23:00:00Z',
        logins: 1542,
      };

      jest
        .spyOn(client.location, 'getCharacterOnline')
        .mockResolvedValue(expectedOnline);
    });

    when('I check their online status', async () => {
      result = await client.location.getCharacterOnline(characterId);
    });

    then('I should see they are online with login timestamps', () => {
      expect(result).toBeDefined();
      expect(result.online).toBe(true);
      expect(result.last_login).toBeDefined();
      expect(result.last_logout).toBeDefined();
      expect(result.logins).toBeGreaterThan(0);
    });
  });

  test('Check online status of an offline character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 123456789;
    let result: any;

    given('an authenticated character who is currently offline', () => {
      const expectedOnline = {
        online: false,
        last_login: '2024-01-10T18:00:00Z',
        last_logout: '2024-01-10T22:30:00Z',
        logins: 87,
      };

      jest
        .spyOn(client.location, 'getCharacterOnline')
        .mockResolvedValue(expectedOnline);
    });

    when('I check their offline status', async () => {
      result = await client.location.getCharacterOnline(characterId);
    });

    then('I should see they are offline', () => {
      expect(result).toBeDefined();
      expect(result.online).toBe(false);
      expect(new Date(result.last_logout!).getTime()).toBeGreaterThan(
        new Date(result.last_login!).getTime(),
      );
    });
  });

  test('Retrieve the ship a character is currently flying', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character in a ship', () => {
      const expectedShip = {
        ship_item_id: 1000000001234,
        ship_name: "Mittani's Titan",
        ship_type_id: 671,
      };

      jest
        .spyOn(client.location, 'getCharacterShip')
        .mockResolvedValue(expectedShip);
    });

    when('I request their current ship', async () => {
      result = await client.location.getCharacterShip(characterId);
    });

    then('I should receive the ship details', () => {
      expect(result).toBeDefined();
      expect(result.ship_item_id).toBe(1000000001234);
      expect(result.ship_name).toBe("Mittani's Titan");
      expect(result.ship_type_id).toBe(671);
    });
  });

  test('Fetch location, online status, and ship simultaneously', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let location: any;
    let online: any;
    let ship: any;

    given('an authenticated character for concurrent location fetch', () => {
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
    });

    when('I fetch location, online status, and ship concurrently', async () => {
      [location, online, ship] = await Promise.all([
        client.location.getCharacterLocation(characterId),
        client.location.getCharacterOnline(characterId),
        client.location.getCharacterShip(characterId),
      ]);
    });

    then('all three location requests should resolve successfully', () => {
      expect(location.solar_system_id).toBe(30000142);
      expect(online.online).toBe(true);
      expect(ship.ship_type_id).toBe(2998);
      expect(ship.ship_name).toBe('Market Runner');
    });
  });

  test('Handle unauthorized access to character location', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated location request', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.location, 'getCharacterLocation')
        .mockRejectedValue(forbiddenError);
    });

    when('I request a character location without auth', async () => {
      try {
        await client.location.getCharacterLocation(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for location', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Handle unauthorized access to online status', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated online status request', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.location, 'getCharacterOnline')
        .mockRejectedValue(forbiddenError);
    });

    when('I request online status without auth', async () => {
      try {
        await client.location.getCharacterOnline(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for online status', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
