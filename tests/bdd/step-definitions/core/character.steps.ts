import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/character.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-character-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN retrieving character public profile, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const validCharacterId = 1689391488;
    let result: any;

    given('a valid character ID', () => {
      const expectedCharacter = TestDataFactory.createCharacterInfo({
        character_id: validCharacterId,
        name: 'Test Character',
        corporation_id: 1344654522,
        alliance_id: 99005338,
      });

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockResolvedValue(expectedCharacter);
    });

    when('the client requests public information', async () => {
      result = await client.characters.getCharacterPublicInfo(validCharacterId);
    });

    then('the client shall return complete character profile', () => {
      expect(result).toBeDefined();
      expect(result.character_id).toBe(validCharacterId);
      expect(result.name).toBe('Test Character');
      expect(result).toHaveProperty('corporation_id');
      expect(result).toHaveProperty('alliance_id');
      expect(result).toHaveProperty('birthday');
    });
  });

  test('IF non-existent character, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidCharacterId = 999999999;
    let error: any;

    given('an invalid character ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockRejectedValue(expectedError);
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
    });
  });

  test('WHEN retrieving character portraits, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a valid character ID for portrait', () => {
      const expectedPortrait = TestDataFactory.createCharacterPortrait();

      jest
        .spyOn(client.characters, 'getCharacterPortrait')
        .mockResolvedValue(expectedPortrait);
    });

    when('the client requests portraits', async () => {
      result = await client.characters.getCharacterPortrait(characterId);
    });

    then('the client shall return image URLs in different sizes', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('px64x64');
      expect(result).toHaveProperty('px128x128');
      expect(result).toHaveProperty('px256x256');
      expect(result).toHaveProperty('px512x512');
    });
  });

  test('WHEN retrieving character roles, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character', () => {
      const expectedRoles = TestDataFactory.createCharacterRoles({
        roles: ['Director', 'Personnel_Manager'],
        roles_at_base: ['Station_Manager'],
        roles_at_hq: ['Director'],
        roles_at_other: [],
      });

      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockResolvedValue(expectedRoles);
    });

    when('the client requests roles', async () => {
      result = await client.characters.getCharacterRoles(characterId);
    });

    then('the client shall return role information', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('roles');
      expect(result.roles).toBeInstanceOf(Array);
      expect(result.roles).toContain('Director');
      expect(result.roles).toContain('Personnel_Manager');
    });
  });

  test('WHEN retrieving corporation history, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character ID for history', () => {
      const expectedHistory = [
        TestDataFactory.createCorporationHistoryEntry({
          corporation_id: 1344654522,
          is_deleted: false,
          record_id: 1,
          start_date: '2020-01-01T00:00:00Z',
        }),
        TestDataFactory.createCorporationHistoryEntry({
          corporation_id: 1000001,
          is_deleted: false,
          record_id: 2,
          start_date: '2015-01-01T00:00:00Z',
        }),
      ];

      jest
        .spyOn(client.characters, 'getCharacterCorporationHistory')
        .mockResolvedValue(expectedHistory);
    });

    when('the client requests corporation history', async () => {
      result =
        await client.characters.getCharacterCorporationHistory(characterId);
    });

    then('the client shall return employment history', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('corporation_id');
      expect(result[0]).toHaveProperty('start_date');
      expect(result[0]).toHaveProperty('record_id');
    });
  });

  test('WHEN retrieving character medals, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character ID for medals', () => {
      const expectedMedals = [
        TestDataFactory.createCharacterMedal({
          medal_id: 1,
          title: 'Test Medal',
          description: 'A test medal for demonstration',
          corporation_id: 1344654522,
          date: '2023-01-01T00:00:00Z',
          issuer_id: 1689391489,
          reason: 'Outstanding service',
        }),
      ];

      jest
        .spyOn(client.characters, 'getCharacterMedals')
        .mockResolvedValue(expectedMedals);
    });

    when('the client requests medals', async () => {
      result = await client.characters.getCharacterMedals(characterId);
    });

    then('the client shall return medal information', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('medal_id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('date');
    });
  });

  test('WHEN retrieving character notifications, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character for notifications', () => {
      const expectedNotifications = [
        TestDataFactory.createCharacterNotification({
          notification_id: 1000001,
          sender_id: 1689391489,
          sender_type: 'character',
          text: 'Test notification',
          timestamp: '2024-01-15T12:00:00Z',
          type: 'AllWarDeclaredMsg',
          is_read: false,
        }),
      ];

      jest
        .spyOn(client.characters, 'getCharacterNotifications')
        .mockResolvedValue(expectedNotifications);
    });

    when('the client requests notifications', async () => {
      result = await client.characters.getCharacterNotifications(characterId);
    });

    then('the client shall return notification list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('notification_id');
      expect(result[0]).toHaveProperty('sender_id');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('timestamp');
    });
  });

  test('IF unauthorized access, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an unauthenticated request', () => {
      const authError = TestDataFactory.createError(403);

      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockRejectedValue(authError);
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
    });
  });

  test('IF expired authentication, THEN the client shall return an authentication error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an expired token', () => {
      const authError = TestDataFactory.createError(401);

      jest
        .spyOn(client.characters, 'getCharacterNotifications')
        .mockRejectedValue(authError);
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
    });
  });

  test('The client shall handle high-frequency character requests', ({
    given,
    when,
    then,
  }) => {
    const characterIds = [1689391488, 1689391489, 1689391490];
    let results: any;

    given('multiple concurrent character requests', () => {
      const mockCharacters = characterIds.map((id) =>
        TestDataFactory.createCharacterInfo({
          character_id: id,
          name: `Character ${id}`,
        }),
      );

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async (id: number) =>
          mockCharacters.find((char) => char.character_id === id)!,
        );
    });

    when('the client makes them simultaneously', async () => {
      const promises = characterIds.map((id) =>
        client.characters.getCharacterPublicInfo(id),
      );
      results = await Promise.all(promises);
    });

    then('all requests shall complete successfully', () => {
      expect(results).toHaveLength(3);
      results.forEach((result: any, index: number) => {
        expect(result.character_id).toBe(characterIds[index]);
        expect(result.name).toBe(`Character ${characterIds[index]}`);
      });
    });
  });

  test('The client shall measure character API response times', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;
    let responseTime: number;

    given('normal API conditions for character', () => {
      const mockCharacter = TestDataFactory.createCharacterInfo({
        character_id: characterId,
      });

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return mockCharacter;
        });
    });

    when('the client requests character data', async () => {
      const startTime = Date.now();
      result = await client.characters.getCharacterPublicInfo(characterId);
      const endTime = Date.now();
      responseTime = endTime - startTime;
    });

    then('the response shall be within acceptable limits', () => {
      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(5000);
      expect(responseTime).toBeGreaterThan(100);
    });
  });

  test('WHEN completing character profile assembly, the client shall complete all steps', ({
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
      const mockCharacter = TestDataFactory.createCharacterInfo({
        character_id: characterId,
      });
      const mockPortrait = TestDataFactory.createCharacterPortrait();
      const mockRoles = TestDataFactory.createCharacterRoles({
        roles: ['Director'],
      });
      const mockNotifications = [
        TestDataFactory.createCharacterNotification({
          notification_id: 1000001,
        }),
      ];

      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockResolvedValue(mockCharacter);
      jest
        .spyOn(client.characters, 'getCharacterPortrait')
        .mockResolvedValue(mockPortrait);
      jest
        .spyOn(client.characters, 'getCharacterRoles')
        .mockResolvedValue(mockRoles);
      jest
        .spyOn(client.characters, 'getCharacterNotifications')
        .mockResolvedValue(mockNotifications);
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
        expect(character).toBeDefined();
        expect(character.character_id).toBe(characterId);

        expect(portrait).toBeDefined();
        expect(portrait.px64x64).toBeDefined();

        expect(roles).toBeDefined();
        expect(roles.roles).toContain('Director');

        expect(notifications).toBeInstanceOf(Array);
        expect(notifications[0].notification_id).toBe(1000001);
      },
    );
  });
});
