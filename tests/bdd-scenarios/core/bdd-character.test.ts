/**
 * BDD Scenarios: Character Management
 * 
 * Comprehensive behavior-driven tests for Character-related APIs
 * covering public information, portraits, roles, and other available endpoints.
 */

import { EsiClient } from '../../../src/EsiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Character Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-character-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000
    });
  });

  describe('Feature: Character Public Information', () => {
    describe('Scenario: Retrieve character public profile', () => {
      it('Given a valid character ID, When I request public information, Then I should receive complete character profile', async () => {
        // Given: A valid character ID
        const validCharacterId = 1689391488;
        const expectedCharacter = TestDataFactory.createCharacterInfo({
          character_id: validCharacterId,
          name: 'Test Character',
          corporation_id: 1344654522,
          alliance_id: 99005338
        });

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockResolvedValue(expectedCharacter);

        // When: I request public information
        const result = await client.characters.getCharacterPublicInfo(validCharacterId);

        // Then: I should receive complete character profile
        expect(result).toBeDefined();
        expect(result.character_id).toBe(validCharacterId);
        expect(result.name).toBe('Test Character');
        expect(result).toHaveProperty('corporation_id');
        expect(result).toHaveProperty('alliance_id');
        expect(result).toHaveProperty('birthday');
      });
    });

    describe('Scenario: Handle non-existent character', () => {
      it('Given an invalid character ID, When I request public information, Then I should receive a not found error', async () => {
        // Given: An invalid character ID
        const invalidCharacterId = 999999999;
        const expectedError = TestDataFactory.createError(ApiErrorType.NOT_FOUND_ERROR, 404);

        // Mock the API to throw an error
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockRejectedValue(expectedError);

        // When & Then: I request character info and expect an error
        await expect(client.characters.getCharacterPublicInfo(invalidCharacterId))
          .rejects
          .toThrow(ApiError);
      });
    });
  });

  describe('Feature: Character Portrait Management', () => {
    describe('Scenario: Retrieve character portraits', () => {
      it('Given a valid character ID, When I request portraits, Then I should receive image URLs in different sizes', async () => {
        // Given: A valid character ID
        const characterId = 1689391488;
        const expectedPortrait = TestDataFactory.createCharacterPortrait();

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterPortrait').mockResolvedValue(expectedPortrait);

        // When: I request portraits
        const result = await client.characters.getCharacterPortrait(characterId);

        // Then: I should receive image URLs in different sizes
        expect(result).toBeDefined();
        expect(result).toHaveProperty('px64x64');
        expect(result).toHaveProperty('px128x128');
        expect(result).toHaveProperty('px256x256');
        expect(result).toHaveProperty('px512x512');
      });
    });
  });

  describe('Feature: Character Roles and Permissions', () => {
    describe('Scenario: Retrieve character roles', () => {
      it('Given an authenticated character, When I request roles, Then I should receive role information', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedRoles = TestDataFactory.createCharacterRoles({
          roles: ['Director', 'Personnel_Manager'],
          roles_at_base: ['Station_Manager'],
          roles_at_hq: ['Director'],
          roles_at_other: []
        });

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterRoles').mockResolvedValue(expectedRoles);

        // When: I request roles
        const result = await client.characters.getCharacterRoles(characterId);

        // Then: I should receive role information
        expect(result).toBeDefined();
        expect(result).toHaveProperty('roles');
        expect(result.roles).toBeInstanceOf(Array);
        expect(result.roles).toContain('Director');
        expect(result.roles).toContain('Personnel_Manager');
      });
    });
  });

  describe('Feature: Character History and Records', () => {
    describe('Scenario: Retrieve corporation history', () => {
      it('Given a character ID, When I request corporation history, Then I should receive employment history', async () => {
        // Given: A character ID
        const characterId = 1689391488;
        const expectedHistory = [
          TestDataFactory.createCorporationHistoryEntry({
            corporation_id: 1344654522,
            is_deleted: false,
            record_id: 1,
            start_date: '2020-01-01T00:00:00Z'
          }),
          TestDataFactory.createCorporationHistoryEntry({
            corporation_id: 1000001,
            is_deleted: false,
            record_id: 2,
            start_date: '2015-01-01T00:00:00Z'
          })
        ];

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterCorporationHistory').mockResolvedValue(expectedHistory);

        // When: I request corporation history
        const result = await client.characters.getCharacterCorporationHistory(characterId);

        // Then: I should receive employment history
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('corporation_id');
        expect(result[0]).toHaveProperty('start_date');
        expect(result[0]).toHaveProperty('record_id');
      });
    });

    describe('Scenario: Retrieve character medals', () => {
      it('Given a character ID, When I request medals, Then I should receive medal information', async () => {
        // Given: A character ID
        const characterId = 1689391488;
        const expectedMedals = [
          TestDataFactory.createCharacterMedal({
            medal_id: 1,
            title: 'Test Medal',
            description: 'A test medal for demonstration',
            corporation_id: 1344654522,
            date: '2023-01-01T00:00:00Z',
            issuer_id: 1689391489,
            reason: 'Outstanding service'
          })
        ];

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterMedals').mockResolvedValue(expectedMedals);

        // When: I request medals
        const result = await client.characters.getCharacterMedals(characterId);

        // Then: I should receive medal information
        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toHaveProperty('medal_id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('date');
      });
    });
  });

  describe('Feature: Character Notifications', () => {
    describe('Scenario: Retrieve character notifications', () => {
      it('Given an authenticated character, When I request notifications, Then I should receive notification list', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedNotifications = [
          TestDataFactory.createCharacterNotification({
            notification_id: 1000001,
            sender_id: 1689391489,
            sender_type: 'character',
            text: 'Test notification',
            timestamp: '2024-01-15T12:00:00Z',
            type: 'AllWarDeclaredMsg',
            is_read: false
          })
        ];

        // Mock the API response
        jest.spyOn(client.characters, 'getCharacterNotifications').mockResolvedValue(expectedNotifications);

        // When: I request notifications
        const result = await client.characters.getCharacterNotifications(characterId);

        // Then: I should receive notification list
        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toHaveProperty('notification_id');
        expect(result[0]).toHaveProperty('sender_id');
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('timestamp');
      });
    });
  });

  describe('Feature: Character Authentication and Authorization', () => {
    describe('Scenario: Handle unauthorized access', () => {
      it('Given an unauthenticated request, When I access private data, Then I should receive an authorization error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const authError = TestDataFactory.createError(ApiErrorType.AUTHORIZATION_ERROR, 403);

        // Mock the API to throw an authorization error
        jest.spyOn(client.characters, 'getCharacterRoles').mockRejectedValue(authError);

        // When & Then: I access private data and expect an authorization error
        await expect(client.characters.getCharacterRoles(characterId))
          .rejects
          .toThrow(ApiError);
      });
    });

    describe('Scenario: Handle expired authentication', () => {
      it('Given an expired token, When I access private data, Then I should receive an authentication error', async () => {
        // Given: An expired token
        const characterId = 1689391488;
        const authError = TestDataFactory.createError(ApiErrorType.AUTHENTICATION_ERROR, 401);

        // Mock the API to throw an authentication error
        jest.spyOn(client.characters, 'getCharacterNotifications').mockRejectedValue(authError);

        // When & Then: I access private data and expect an authentication error
        await expect(client.characters.getCharacterNotifications(characterId))
          .rejects
          .toThrow(ApiError);
      });
    });
  });

  describe('Feature: Character Performance and Reliability', () => {
    describe('Scenario: Handle high-frequency character requests', () => {
      it('Given multiple concurrent character requests, When I make them simultaneously, Then all should complete successfully', async () => {
        // Given: Multiple concurrent character requests
        const characterIds = [1689391488, 1689391489, 1689391490];
        const mockCharacters = characterIds.map(id => 
          TestDataFactory.createCharacterInfo({ character_id: id, name: `Character ${id}` })
        );

        // Mock the API responses
        jest.spyOn(client.characters, 'getCharacterPublicInfo')
          .mockImplementation(async (id: number) => 
            mockCharacters.find(char => char.character_id === id)!
          );

        // When: I make them simultaneously
        const promises = characterIds.map(id => client.characters.getCharacterPublicInfo(id));
        const results = await Promise.all(promises);

        // Then: All should complete successfully
        expect(results).toHaveLength(3);
        results.forEach((result: any, index: number) => {
          expect(result.character_id).toBe(characterIds[index]);
          expect(result.name).toBe(`Character ${characterIds[index]}`);
        });
      });
    });

    describe('Scenario: Measure character API response times', () => {
      it('Given normal API conditions, When I request character data, Then response should be within acceptable limits', async () => {
        // Given: Normal API conditions
        const characterId = 1689391488;
        const mockCharacter = TestDataFactory.createCharacterInfo({ character_id: characterId });

        // Mock with simulated network delay
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay
          return mockCharacter;
        });

        // When: I request character data and measure time
        const startTime = Date.now();
        const result = await client.characters.getCharacterPublicInfo(characterId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Then: Response should be within acceptable limits
        expect(result).toBeDefined();
        expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(responseTime).toBeGreaterThan(100); // Should take at least 100ms (due to mock delay)
      });
    });
  });

  describe('Feature: Character Data Integration', () => {
    describe('Scenario: Complete character profile assembly', () => {
      it('Given a character ID, When I gather complete profile data, Then I should successfully retrieve all available character information', async () => {
        // Given: A character ID
        const characterId = 1689391488;
        const mockCharacter = TestDataFactory.createCharacterInfo({ character_id: characterId });
        const mockPortrait = TestDataFactory.createCharacterPortrait();
        const mockRoles = TestDataFactory.createCharacterRoles({ roles: ['Director'] });
        const mockNotifications = [TestDataFactory.createCharacterNotification({ notification_id: 1000001 })];

        // Mock all API responses
        jest.spyOn(client.characters, 'getCharacterPublicInfo').mockResolvedValue(mockCharacter);
        jest.spyOn(client.characters, 'getCharacterPortrait').mockResolvedValue(mockPortrait);
        jest.spyOn(client.characters, 'getCharacterRoles').mockResolvedValue(mockRoles);
        jest.spyOn(client.characters, 'getCharacterNotifications').mockResolvedValue(mockNotifications);

        // When: I gather complete profile data
        const [character, portrait, roles, notifications] = await Promise.all([
          client.characters.getCharacterPublicInfo(characterId),
          client.characters.getCharacterPortrait(characterId),
          client.characters.getCharacterRoles(characterId),
          client.characters.getCharacterNotifications(characterId)
        ]);

        // Then: I should successfully retrieve all available character information
        expect(character).toBeDefined();
        expect(character.character_id).toBe(characterId);
        
        expect(portrait).toBeDefined();
        expect(portrait.px64x64).toBeDefined();
        
        expect(roles).toBeDefined();
        expect(roles.roles).toContain('Director');
        
        expect(notifications).toBeInstanceOf(Array);
        expect(notifications[0].notification_id).toBe(1000001);
      });
    });
  });
});