import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/search.feature');

const allCategories = [
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
];

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  test('Search for characters by name', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'Test Pilot';
    const expectedResults = {
      character: [1689391488, 123456789, 111111111],
    };

    given('a valid character ID and search string', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search for characters', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should receive matching character results', () => {
      expect(result).toBeDefined();
      expect(result.character).toHaveLength(3);
      expect(result.character).toContain(1689391488);
    });
  });

  test('Search returns results across multiple categories', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'Jita';
    const expectedResults = {
      solar_system: [30000142],
      station: [60003760, 60003761],
      character: [555555555],
      corporation: [1344654522],
    };

    given('a broad search query', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search across categories', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should receive results in multiple categories', () => {
      expect(result).toBeDefined();
      expect(result.solar_system).toHaveLength(1);
      expect(result.solar_system).toContain(30000142);
      expect(result.station).toHaveLength(2);
      expect(result.character).toHaveLength(1);
      expect(result.corporation).toHaveLength(1);
    });
  });

  test('Search returns empty results', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'xyznonexistent12345';
    const expectedResults = {};

    given('a search query with no matches', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search for nonexistent items', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should receive undefined or empty category arrays', () => {
      expect(result).toBeDefined();
      expect(result.solar_system).toBeUndefined();
      expect(result.station).toBeUndefined();
      expect(result.character).toBeUndefined();
      expect(result.corporation).toBeUndefined();
      expect(result.alliance).toBeUndefined();
    });
  });

  test('Search for solar systems', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'Amarr';
    const expectedResults = {
      solar_system: [30002187, 30002188, 30002189],
    };

    given('a search for a solar system name', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search for solar systems', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should receive matching system IDs', () => {
      expect(result).toBeDefined();
      expect(result.solar_system).toHaveLength(3);
      expect(result.solar_system).toContain(30002187);
    });
  });

  test('Search for alliances', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'Goonswarm';
    const expectedResults = {
      alliance: [99005338],
    };

    given('a search for an alliance name', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search for alliances', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should receive matching alliance IDs', () => {
      expect(result).toBeDefined();
      expect(result.alliance).toHaveLength(1);
      expect(result.alliance).toContain(99005338);
    });
  });

  test('Unauthorized search request', ({ given, when, then }) => {
    let caughtError: any;
    const characterId = 90000001;
    const searchString = 'test';

    given('insufficient search permissions', () => {
      const error = TestDataFactory.createError(403);
      jest.spyOn(client.search, 'characterSearch').mockRejectedValue(error);
    });

    when('I search without permissions', async () => {
      try {
        await client.search.characterSearch(characterId, searchString, [
          'character',
        ] as any);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 search error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Search with short query string', ({ given, when, then }) => {
    let result: any;
    const characterId = 90000001;
    const searchString = 'Ji';
    const expectedResults = {
      solar_system: [30000142],
      character: [987654321],
    };

    given('a very short search string', () => {
      jest
        .spyOn(client.search, 'characterSearch')
        .mockResolvedValue(expectedResults as any);
    });

    when('I search with a short query', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories as any,
      );
    });

    then('I should still receive valid results', () => {
      expect(result).toBeDefined();
      expect(result.solar_system).toHaveLength(1);
      expect(result.character).toHaveLength(1);
    });
  });
});
