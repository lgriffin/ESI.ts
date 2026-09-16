import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0030-search.feature');

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

const characterId = 90000001;
const SEARCH_PATH = `/characters/${characterId}/search`;

/**
 * Assert the one search request the client sent: an authenticated GET to the
 * character's search path carrying the query string and category list.
 */
function expectSearchRequest(search: string, categories: string[]): void {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(
    new RegExp(`/characters/${characterId}/search/?$`),
  );
  expect(request.url.searchParams.get('search')).toBe(search);
  expect(request.url.searchParams.get('categories')).toBe(categories.join(','));
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Character name query returns three character IDs', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const searchString = 'Test Pilot';

    given('a valid character ID and search string', () => {
      queueResponse({
        match: SEARCH_PATH,
        body: { character: [1689391488, 123456789, 111111111] },
      });
    });

    when('the client searches for characters', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('the client shall return matching character results', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual({
        character: [1689391488, 123456789, 111111111],
      });
    });
  });

  test('Jita query returns systems, stations, characters, and corporations', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const searchString = 'Jita';
    const expectedResults = {
      solar_system: [30000142],
      station: [60003760, 60003761],
      character: [555555555],
      corporation: [1344654522],
    };

    given('a broad search query', () => {
      queueResponse({ match: SEARCH_PATH, body: expectedResults });
    });

    when('the client searches across categories', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('the client shall return results in multiple categories', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual(expectedResults);
      expect(result.solar_system).toEqual([30000142]);
      expect(result.station).toEqual([60003760, 60003761]);
      expect(result.character).toEqual([555555555]);
      expect(result.corporation).toEqual([1344654522]);
      expect(result.alliance).toBeUndefined();
    });
  });

  test('Query matching nothing returns an object with no category keys', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const searchString = 'xyznonexistent12345';

    given('a search query with no matches', () => {
      queueResponse({ match: SEARCH_PATH, body: {} });
    });

    when('the client searches for nonexistent items', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('the client shall return undefined or empty category arrays', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual({});
      for (const category of allCategories) {
        expect(result).not.toHaveProperty(category);
      }
    });
  });

  test('Amarr query returns three solar system IDs', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const searchString = 'Amarr';

    given('a search for a solar system name', () => {
      queueResponse({
        match: SEARCH_PATH,
        body: { solar_system: [30002187, 30002188, 30002189] },
      });
    });

    when('the client searches for solar systems', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('the client shall return matching system IDs', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual({
        solar_system: [30002187, 30002188, 30002189],
      });
    });
  });

  test('Goonswarm query returns one alliance ID', ({ given, when, then }) => {
    let result: any;
    const searchString = 'Goonswarm';

    given('a search for an alliance name', () => {
      queueResponse({ match: SEARCH_PATH, body: { alliance: [99005338] } });
    });

    when('the client searches for alliances', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('the client shall return matching alliance IDs', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual({ alliance: [99005338] });
    });
  });

  test('Search without the search scope is rejected with 403', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const searchString = 'test';

    given('insufficient search permissions', () => {
      queueError(403, 'Character does not have required role(s)', {
        match: SEARCH_PATH,
      });
    });

    when('the client searches without permissions', async () => {
      try {
        await client.search.characterSearch(characterId, searchString, [
          'character',
        ]);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 403 search error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect((caughtError as EsiError).isForbidden()).toBe(true);
      // 403 is not retried.
      expectSearchRequest(searchString, ['character']);
    });
  });

  test('Two-character query returns system and character matches', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const searchString = 'Ji';

    given('a very short search string', () => {
      queueResponse({
        match: SEARCH_PATH,
        body: { solar_system: [30000142], character: [987654321] },
      });
    });

    when('the client searches with a short query', async () => {
      result = await client.search.characterSearch(
        characterId,
        searchString,
        allCategories,
      );
    });

    then('I shall still receive valid results', () => {
      expectSearchRequest(searchString, allCategories);
      expect(result).toEqual({
        solar_system: [30000142],
        character: [987654321],
      });
    });
  });
});
