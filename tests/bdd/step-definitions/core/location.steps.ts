import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0020-location.feature');

const BEARER = 'Bearer bdd-access-token';

/** Match a URL whose path is exactly `path` (query string allowed). */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Character docked in Jita 4-4', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character docked in a station', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/location`),
        body: TestDataFactory.createCharacterLocation({
          solar_system_id: 30000142,
          station_id: 60003760,
        }),
      });
    });

    when('the client requests their location', async () => {
      result = await client.location.getCharacterLocation(characterId);
    });

    then(
      'the client shall return the solar system and station information',
      () => {
        const request = lastRequest();
        expect(request.method).toBe('GET');
        expect(request.url.pathname).toBe(
          `/characters/${characterId}/location`,
        );
        expect(request.headers.authorization).toBe(BEARER);
        expect(result).toEqual({
          solar_system_id: 30000142,
          station_id: 60003760,
        });
      },
    );
  });

  test('Character undocked in space', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character flying in space', () => {
      // Undocked, ESI omits both docking fields from the payload.
      queueResponse({
        match: exactPath(`/characters/${characterId}/location`),
        body: { solar_system_id: 30002187 },
      });
    });

    when('the client requests their location while in space', async () => {
      result = await client.location.getCharacterLocation(characterId);
    });

    then(
      'the client shall return only the solar system with no station',
      () => {
        expect(sentRequests()).toHaveLength(1);
        expect(result.solar_system_id).toBe(30002187);
        expect(result.station_id).toBeUndefined();
        expect(result.structure_id).toBeUndefined();
        expect(Object.keys(result)).toEqual(['solar_system_id']);
      },
    );
  });

  test('Online character with login history', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character who is currently online', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/online`),
        body: {
          online: true,
          last_login: '2024-01-15T08:00:00Z',
          last_logout: '2024-01-14T23:00:00Z',
          logins: 1542,
        },
      });
    });

    when('the client checks their online status', async () => {
      result = await client.location.getCharacterOnline(characterId);
    });

    then(
      'the client shall report they are online with login timestamps',
      () => {
        const request = lastRequest();
        expect(request.url.pathname).toBe(`/characters/${characterId}/online`);
        expect(request.headers.authorization).toBe(BEARER);
        expect(result).toEqual({
          online: true,
          last_login: '2024-01-15T08:00:00Z',
          last_logout: '2024-01-14T23:00:00Z',
          logins: 1542,
        });
      },
    );
  });

  test('Offline character logged out after their last login', ({
    given,
    when,
    then,
  }) => {
    const characterId = 123456789;
    let result: any;

    given('an authenticated character who is currently offline', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/online`),
        body: {
          online: false,
          last_login: '2024-01-10T18:00:00Z',
          last_logout: '2024-01-10T22:30:00Z',
          logins: 87,
        },
      });
    });

    when('the client checks their offline status', async () => {
      result = await client.location.getCharacterOnline(characterId);
    });

    then('the client shall report they are offline', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/online`,
      );
      expect(result.online).toBe(false);
      expect(result.last_login).toBe('2024-01-10T18:00:00Z');
      expect(result.last_logout).toBe('2024-01-10T22:30:00Z');
      expect(new Date(result.last_logout!).getTime()).toBeGreaterThan(
        new Date(result.last_login!).getTime(),
      );
    });
  });

  test('Pilot flying a named titan', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character in a ship', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/ship`),
        body: {
          ship_item_id: 1000000001234,
          ship_name: "Mittani's Titan",
          ship_type_id: 671,
        },
      });
    });

    when('the client requests their current ship', async () => {
      result = await client.location.getCharacterShip(characterId);
    });

    then('the client shall return the ship details', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(`/characters/${characterId}/ship`);
      expect(request.headers.authorization).toBe(BEARER);
      expect(result).toEqual({
        ship_item_id: 1000000001234,
        ship_name: "Mittani's Titan",
        ship_type_id: 671,
      });
    });
  });

  test('Location, online status, and ship fetched in parallel', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let location: any;
    let online: any;
    let ship: any;

    given('an authenticated character for concurrent location fetch', () => {
      // Responses arrive in the reverse order of the calls, so each result
      // has to be routed back to the request that asked for it.
      queueResponse({
        match: exactPath(`/characters/${characterId}/location`),
        body: TestDataFactory.createCharacterLocation({
          solar_system_id: 30000142,
          station_id: 60003760,
        }),
        delayMs: 30,
      });
      queueResponse({
        match: exactPath(`/characters/${characterId}/online`),
        body: {
          online: true,
          last_login: '2024-01-15T08:00:00Z',
          last_logout: '2024-01-14T23:00:00Z',
          logins: 1542,
        },
        delayMs: 15,
      });
      queueResponse({
        match: exactPath(`/characters/${characterId}/ship`),
        body: {
          ship_item_id: 1000000005678,
          ship_name: 'Market Runner',
          ship_type_id: 2998,
        },
      });
    });

    when(
      'the client fetches location, online status, and ship concurrently',
      async () => {
        [location, online, ship] = await Promise.all([
          client.location.getCharacterLocation(characterId),
          client.location.getCharacterOnline(characterId),
          client.location.getCharacterShip(characterId),
        ]);
      },
    );

    then('all three location requests shall resolve successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(location).toEqual({
        solar_system_id: 30000142,
        station_id: 60003760,
      });
      expect(online).toEqual({
        online: true,
        last_login: '2024-01-15T08:00:00Z',
        last_logout: '2024-01-14T23:00:00Z',
        logins: 1542,
      });
      expect(ship).toEqual({
        ship_item_id: 1000000005678,
        ship_name: 'Market Runner',
        ship_type_id: 2998,
      });
    });
  });

  test('Location request without a token', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated location request', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/location`),
      });
    });

    when('the client requests a character location without auth', async () => {
      try {
        await client.location.getCharacterLocation(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for location', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/location`,
      );
    });
  });

  test('Online status request without a token', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated online status request', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/online`),
      });
    });

    when('the client requests online status without auth', async () => {
      try {
        await client.location.getCharacterOnline(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then(
      'the client shall return a 403 forbidden error for online status',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
        expect(lastRequest().url.pathname).toBe(
          `/characters/${characterId}/online`,
        );
      },
    );
  });
});
