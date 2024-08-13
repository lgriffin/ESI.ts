import { CharacterSearchApi } from '../../../src/api/search/getCharacterSearch';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const characterSearchApi = new CharacterSearchApi(client);

interface SearchResult {
    character_id: number;
    name: string;
}

interface CharacterSearchResponse {
    search_results: SearchResult[];
}

describe('CharacterSearchApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return search results for a character', async () => {
        const mockResponse: CharacterSearchResponse = {
            search_results: [{ character_id: 12345, name: 'Test Character' }],
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterSearchApi.searchCharacter(1689391488, 'Test')) as CharacterSearchResponse;

        expect(result).toHaveProperty('search_results');
        expect(Array.isArray(result.search_results)).toBe(true);
        result.search_results.forEach((item: SearchResult) => {
            expect(item).toHaveProperty('character_id');
            expect(typeof item.character_id).toBe('number');
            expect(item).toHaveProperty('name');
            expect(typeof item.name).toBe('string');
        });
    });
});
