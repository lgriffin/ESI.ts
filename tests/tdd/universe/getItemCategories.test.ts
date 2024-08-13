import { UniverseCategoriesApi } from '../../../src/api/universe/getItemCategories';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseCategoriesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeCategoriesApi = new UniverseCategoriesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCategories', async () => {
        const mockResponse = [{ category_id: 1, name: 'Category 1' }, { category_id: 2, name: 'Category 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeCategoriesApi.getCategories());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((category: any) => {
            expect(category).toHaveProperty('category_id');
            expect(typeof category.category_id).toBe('number');
            expect(category).toHaveProperty('name');
            expect(typeof category.name).toBe('string');
        });
    });
});
