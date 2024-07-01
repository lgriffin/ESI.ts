import { PostNamesAndCategoriesApi } from '../../../src/api/universe/postNamesAndCategories';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('PostNamesAndCategoriesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const postNamesAndCategoriesApi = new PostNamesAndCategoriesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for postNamesAndCategories', async () => {
        const mockResponse = [
            { id: 123, name: 'Test Name', category: 'character' },
            { id: 456, name: 'Another Name', category: 'corporation' }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type NamesAndCategoriesResponse = {
            id: number;
            name: string;
            category: string;
        };

        const result = await postNamesAndCategoriesApi.postNamesAndCategories([123, 456]) as NamesAndCategoriesResponse[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((item: NamesAndCategoriesResponse) => {
            expect(item).toHaveProperty('id');
            expect(typeof item.id).toBe('number');
            expect(item).toHaveProperty('name');
            expect(typeof item.name).toBe('string');
            expect(item).toHaveProperty('category');
            expect(typeof item.category).toBe('string');
        });
    });
});
