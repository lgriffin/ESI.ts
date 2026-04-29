/**
 * BDD-Style Testing for Search API
 *
 * This demonstrates BDD principles for the Search API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Search Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  describe('Feature: Character Search', () => {
    describe('Scenario: Search for characters by name', () => {
      it('Given a valid character ID and search string, When I search for characters, Then I should receive matching character results', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'Test Pilot';
        const expectedResults = {
          character: [1689391488, 123456789, 111111111],
        };

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.character).toHaveLength(3);
        expect(result.character).toContain(1689391488);
      });
    });

    describe('Scenario: Search returns results across multiple categories', () => {
      it('Given a broad search query, When I search, Then I should receive results in multiple categories', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'Jita';
        const expectedResults = {
          solar_system: [30000142],
          station: [60003760, 60003761],
          character: [555555555],
          corporation: [1344654522],
        };

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.solar_system).toHaveLength(1);
        expect(result.solar_system).toContain(30000142);
        expect(result.station).toHaveLength(2);
        expect(result.character).toHaveLength(1);
        expect(result.corporation).toHaveLength(1);
      });
    });

    describe('Scenario: Search returns empty results', () => {
      it('Given a search query with no matches, When I search, Then I should receive undefined or empty category arrays', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'xyznonexistent12345';
        const expectedResults = {};

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.solar_system).toBeUndefined();
        expect(result.station).toBeUndefined();
        expect(result.character).toBeUndefined();
        expect(result.corporation).toBeUndefined();
        expect(result.alliance).toBeUndefined();
      });
    });

    describe('Scenario: Search for solar systems', () => {
      it('Given a search for a solar system name, When I search, Then I should receive matching system IDs', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'Amarr';
        const expectedResults = {
          solar_system: [30002187, 30002188, 30002189],
        };

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.solar_system).toHaveLength(3);
        expect(result.solar_system).toContain(30002187);
      });
    });

    describe('Scenario: Search for alliances', () => {
      it('Given a search for an alliance name, When I search, Then I should receive matching alliance IDs', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'Goonswarm';
        const expectedResults = {
          alliance: [99005338],
        };

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.alliance).toHaveLength(1);
        expect(result.alliance).toContain(99005338);
      });
    });

    describe('Scenario: Unauthorized search request', () => {
      it('Given insufficient permissions, When I search, Then I should receive a 403 error', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'test';
        const error = TestDataFactory.createError(403);

        jest.spyOn(client.search, 'characterSearch').mockRejectedValue(error);

        // When & Then
        await expect(
          client.search.characterSearch(characterId, searchString, [
            'character',
          ]),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Search with short query string', () => {
      it('Given a very short search string, When I search, Then I should still receive valid results', async () => {
        // Given
        const characterId = 90000001;
        const searchString = 'Ji';
        const expectedResults = {
          solar_system: [30000142],
          character: [987654321],
        };

        jest
          .spyOn(client.search, 'characterSearch')
          .mockResolvedValue(expectedResults as any);

        // When
        const result = await client.search.characterSearch(
          characterId,
          searchString,
          [
            'character',
            'corporation',
            'alliance',
            'solar_system',
            'station',
            'constellation',
            'region',
            'faction',
            'inventory_type',
            'agent',
          ],
        );

        // Then
        expect(result).toBeDefined();
        expect(result.solar_system).toHaveLength(1);
        expect(result.character).toHaveLength(1);
      });
    });
  });
});
