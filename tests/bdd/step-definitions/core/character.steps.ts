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

const feature = loadFeature('tests/bdd/features/core/0002-character.feature');

/**
 * The public profile path `/characters/{id}/` is a prefix of every other
 * character path, so its response is pinned to the end of the URL.
 */
const profilePath = (characterId: number) =>
  new RegExp(`/characters/${characterId}/$`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Public profile for a known character ID', ({ given, when, then }) => {
    const validCharacterId = 1689391488;
    let result: any;

    given('a valid character ID', () => {
      queueResponse({
        match: profilePath(validCharacterId),
        body: TestDataFactory.createCharacterInfo({
          name: 'Test Character',
          corporation_id: 1344654522,
          alliance_id: 99005338,
          birthday: '2003-05-06T00:00:00Z',
        }),
      });
    });

    when('the client requests public information', async () => {
      result = await client.characters.getCharacterPublicInfo(validCharacterId);
    });

    then('the client shall return complete character profile', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${validCharacterId}/`);
      expect(result).toMatchObject({
        name: 'Test Character',
        corporation_id: 1344654522,
        alliance_id: 99005338,
        birthday: '2003-05-06T00:00:00Z',
      });
    });
  });

  test('Unknown character ID rejects the request', ({ given, when, then }) => {
    const invalidCharacterId = 999999999;
    let error: any;

    given('an invalid character ID', () => {
      // 404 is not retryable, so ESI answers exactly once.
      queueError(404, 'Character not found', {
        match: profilePath(invalidCharacterId),
      });
    });

    when(
      'the client requests public information for the invalid character',
      async () => {
        try {
          await client.characters.getCharacterPublicInfo(invalidCharacterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Portrait URLs at four pixel sizes', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a valid character ID for portrait', () => {
      queueResponse({
        match: `/characters/${characterId}/portrait/`,
        body: TestDataFactory.createCharacterPortrait(characterId),
      });
    });

    when('the client requests portraits', async () => {
      result = await client.characters.getCharacterPortrait(characterId);
    });

    then('the client shall return image URLs in different sizes', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/portrait/`,
      );
      expect(result).toEqual({
        px64x64: `https://images.evetech.net/characters/${characterId}/portrait?size=64`,
        px128x128: `https://images.evetech.net/characters/${characterId}/portrait?size=128`,
        px256x256: `https://images.evetech.net/characters/${characterId}/portrait?size=256`,
        px512x512: `https://images.evetech.net/characters/${characterId}/portrait?size=512`,
      });
    });
  });

  test('Role assignments for an authenticated character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character', () => {
      queueResponse({
        match: `/characters/${characterId}/roles`,
        body: TestDataFactory.createCharacterRoles({
          roles: ['Director', 'Personnel_Manager'],
          roles_at_base: ['Station_Manager'],
          roles_at_hq: ['Director'],
          roles_at_other: [],
        }),
      });
    });

    when('the client requests roles', async () => {
      result = await client.characters.getCharacterRoles(characterId);
    });

    then('the client shall return role information', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(`/characters/${characterId}/roles`);
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result.roles).toEqual(['Director', 'Personnel_Manager']);
      expect(result.roles_at_base).toEqual(['Station_Manager']);
    });
  });

  test('Employment history entries for a character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character ID for history', () => {
      queueResponse({
        match: `/characters/${characterId}/corporationhistory/`,
        body: [
          TestDataFactory.createCorporationHistoryEntry({
            corporation_id: 1344654522,
            is_deleted: false,
            record_id: 2,
            start_date: '2020-01-01T00:00:00Z',
          }),
          TestDataFactory.createCorporationHistoryEntry({
            corporation_id: 1000001,
            is_deleted: false,
            record_id: 1,
            start_date: '2015-01-01T00:00:00Z',
          }),
        ],
      });
    });

    when('the client requests corporation history', async () => {
      result =
        await client.characters.getCharacterCorporationHistory(characterId);
    });

    then('the client shall return employment history', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/corporationhistory/`,
      );
      expect(
        result.map((e: any) => [e.corporation_id, e.start_date, e.record_id]),
      ).toEqual([
        [1344654522, '2020-01-01T00:00:00Z', 2],
        [1000001, '2015-01-01T00:00:00Z', 1],
      ]);
    });
  });

  test('Medal entries awarded to a character', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character ID for medals', () => {
      queueResponse({
        match: `/characters/${characterId}/medals/`,
        body: [
          TestDataFactory.createCharacterMedal({
            medal_id: 1,
            title: 'Test Medal',
            description: 'A test medal for demonstration',
            corporation_id: 1344654522,
            date: '2023-01-01T00:00:00Z',
            issuer_id: 1689391489,
            reason: 'Outstanding service',
            status: 'public',
            graphics: [
              { part: 1, layer: 0, graphic: 'caldari.1_1', color: -1 },
              { part: 2, layer: 1, graphic: 'caldari.2_3' },
            ],
          }),
        ],
      });
    });

    when('the client requests medals', async () => {
      result = await client.characters.getCharacterMedals(characterId);
    });

    then('the client shall return medal information', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/medals/`,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        medal_id: 1,
        title: 'Test Medal',
        description: 'A test medal for demonstration',
        date: '2023-01-01T00:00:00Z',
      });
    });
  });

  test('Notification entries for an authenticated character', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character for notifications', () => {
      queueResponse({
        match: `/characters/${characterId}/notifications/`,
        body: [
          TestDataFactory.createCharacterNotification({
            notification_id: 1000001,
            sender_id: 1689391489,
            sender_type: 'character',
            text: 'Test notification',
            timestamp: '2024-01-15T12:00:00Z',
            type: 'AllWarDeclaredMsg',
            is_read: false,
          }),
        ],
      });
    });

    when('the client requests notifications', async () => {
      result = await client.characters.getCharacterNotifications(characterId);
    });

    then('the client shall return notification list', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/notifications/`,
      );
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        notification_id: 1000001,
        sender_id: 1689391489,
        type: 'AllWarDeclaredMsg',
        timestamp: '2024-01-15T12:00:00Z',
      });
    });
  });

  test('Missing authorization on the roles endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an unauthenticated request', () => {
      queueError(403, 'Token not valid for scope(s)', {
        match: `/characters/${characterId}/roles`,
      });
    });

    when('the client accesses private data without authorization', async () => {
      try {
        await client.characters.getCharacterRoles(characterId);
      } catch (e) {
        error = e;
      }
    });

    then('the client shall return an authorization error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Expired token on the notifications endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an expired token', () => {
      // No token refresh is configured, so the 401 is final.
      queueError(401, 'token is expired', {
        match: `/characters/${characterId}/notifications/`,
      });
    });

    when('the client accesses private data with expired token', async () => {
      try {
        await client.characters.getCharacterNotifications(characterId);
      } catch (e) {
        error = e;
      }
    });

    then('the client shall return an authentication error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(401);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Three character profiles fetched at once', ({ given, when, then }) => {
    const characterIds = [1689391488, 1689391489, 1689391490];
    let results: any;

    given('multiple concurrent character requests', () => {
      // Later IDs answer first, so a pipeline that paired responses with
      // calls by arrival order would hand each call the wrong record.
      characterIds.forEach((id, index) => {
        queueResponse({
          match: profilePath(id),
          body: TestDataFactory.createCharacterInfo({
            name: `Character ${id}`,
          }),
          delayMs: (characterIds.length - index) * 15,
        });
      });
    });

    when('the client makes them simultaneously', async () => {
      const promises = characterIds.map((id) =>
        client.characters.getCharacterPublicInfo(id),
      );
      results = await Promise.all(promises);
    });

    then('all requests shall complete successfully', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(characterIds.map((id) => `/characters/${id}/`));
      expect(results.map((r: any) => r.name)).toEqual(
        characterIds.map((id) => `Character ${id}`),
      );
    });
  });

  test('Character profile resolves inside the latency budget', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;
    let responseTime: number;

    given('normal API conditions for character', () => {
      queueResponse({
        match: profilePath(characterId),
        body: TestDataFactory.createCharacterInfo(),
        delayMs: 150,
      });
    });

    when('the client requests character data', async () => {
      const startTime = Date.now();
      result = await client.characters.getCharacterPublicInfo(characterId);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the response shall be within acceptable limits', () => {
      expect(result.name).toBe('Test Character');
      expect(responseTime).toBeLessThan(5000);
      expect(responseTime).toBeGreaterThanOrEqual(140);
    });
  });

  test('Concurrent fetch of profile, portrait, roles, and notifications', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let character: any;
    let portrait: any;
    let roles: any;
    let notifications: any;

    given('a character ID for profile assembly', () => {
      queueResponse({
        match: profilePath(characterId),
        body: TestDataFactory.createCharacterInfo({ name: 'Profile Pilot' }),
        delayMs: 20,
      });
      queueResponse({
        match: `/characters/${characterId}/portrait/`,
        body: TestDataFactory.createCharacterPortrait(characterId),
      });
      queueResponse({
        match: `/characters/${characterId}/roles`,
        body: TestDataFactory.createCharacterRoles({ roles: ['Director'] }),
        delayMs: 10,
      });
      queueResponse({
        match: `/characters/${characterId}/notifications/`,
        body: [
          TestDataFactory.createCharacterNotification({
            notification_id: 1000001,
          }),
        ],
      });
    });

    when('the client gathers complete profile data', async () => {
      [character, portrait, roles, notifications] = await Promise.all([
        client.characters.getCharacterPublicInfo(characterId),
        client.characters.getCharacterPortrait(characterId),
        client.characters.getCharacterRoles(characterId),
        client.characters.getCharacterNotifications(characterId),
      ]);
    });

    then(
      'the client shall successfully retrieve all available character information',
      () => {
        expect(sentRequests()).toHaveLength(4);
        expect(character.name).toBe('Profile Pilot');
        expect(portrait.px64x64).toBe(
          `https://images.evetech.net/characters/${characterId}/portrait?size=64`,
        );
        expect(roles.roles).toEqual(['Director']);
        expect(notifications.map((n: any) => n.notification_id)).toEqual([
          1000001,
        ]);
      },
    );
  });
});
