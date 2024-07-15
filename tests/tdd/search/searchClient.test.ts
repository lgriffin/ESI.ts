import { SearchClient } from '../../../src/clients/SearchClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { CharacterSearchApi } from '../../../src/api/search/getCharacterSearch';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const searchClient = new SearchClient(
    new CharacterSearchApi(client)
);

describe('SearchClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return search results for a character', async () => {
        const mockResponse = { search_results: [{ character_id: 12345, name: 'Test Character' }] };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await searchClient.searchCharacter(12345, 'Test');

        expect(result).toHaveProperty('search_results');
        expect(Array.isArray(result.search_results)).toBe(true);
        result.search_results.forEach((item: { character_id: number; name: string }) => {
            expect(item).toHaveProperty('character_id');
            expect(typeof item.character_id).toBe('number');
            expect(item).toHaveProperty('name');
            expect(typeof item.name).toBe('string');
        });
    });
});
