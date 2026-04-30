import { ApiClient } from '../../../src/core/ApiClient';
import { SearchClient } from '../../../src/clients/SearchClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('SearchClient', () => {
  let client: ApiClient;
  let searchClient: SearchClient;

  beforeEach(() => {
    client = new ApiClient(
      'projectName',
      'https://esi.evetech.net/latest',
      'token',
    );
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    searchClient = new SearchClient(client);
    fetchMock.resetMocks();
  });

  it('should return search results for a character', async () => {
    const mockResponse = {
      search_results: {
        character: [12345678],
        corporation: [],
        alliance: [],
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = (await getBody(() =>
      searchClient.characterSearch(1689391488, 'searchString', [
        'character',
        'corporation',
        'alliance',
      ]),
    )) as {
      search_results: {
        character: number[];
        corporation: number[];
        alliance: number[];
      };
    };

    expect(result).toHaveProperty('search_results');
    expect(result.search_results).toHaveProperty('character');
    expect(result.search_results.character).toContain(12345678);
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://esi.evetech.net/latest/characters/1689391488/search/',
    );
  });
});
