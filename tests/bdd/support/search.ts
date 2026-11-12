/**
 * What ESI's character search endpoint sends back in 0030-search.feature, and
 * where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */
import { lastRequest, queueResponse, sentRequests } from './transport';

export const SEARCHING_CHARACTER_ID = 90000001;

export const ALL_CATEGORIES = [
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

export const searchPaths = {
  search: `/characters/${SEARCHING_CHARACTER_ID}/search`,
};

/** The query string each scenario searches for. */
export const searchQueries = {
  characterName: 'Test Pilot',
  broad: 'Jita',
  solarSystem: 'Amarr',
  alliance: 'Goonswarm',
  short: 'Ji',
  nothing: 'xyznonexistent12345',
  forbidden: 'test',
};

export const searchFixtures = {
  characters: () => ({ character: [1689391488, 123456789, 111111111] }),

  broad: () => ({
    solar_system: [30000142],
    station: [60003760, 60003761],
    character: [555555555],
    corporation: [1344654522],
  }),

  solarSystems: () => ({ solar_system: [30002187, 30002188, 30002189] }),

  alliances: () => ({ alliance: [99005338] }),

  short: () => ({ solar_system: [30000142], character: [987654321] }),

  nothing: () => ({}),
};

/** Queue one search response with `body`. */
export function queueSearch(body: unknown): void {
  queueResponse({ match: searchPaths.search, body });
}

/**
 * Assert the one search request the client sent: an authenticated GET to the
 * character's search path carrying the query string and category list.
 */
export function expectSearchRequest(
  search: string,
  categories: string[],
): void {
  expect(sentRequests()).toHaveLength(1);
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toMatch(
    new RegExp(`/characters/${SEARCHING_CHARACTER_ID}/search/?$`),
  );
  expect(request.url.searchParams.get('search')).toBe(search);
  expect(request.url.searchParams.get('categories')).toBe(categories.join(','));
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');
}
