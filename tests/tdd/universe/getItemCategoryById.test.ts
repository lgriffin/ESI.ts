import { UniverseCategoryByIdApi } from '../../../src/api/universe/getItemCategoryById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseCategoryByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeCategoryByIdApi = new UniverseCategoryByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCategoryById', async () => {
        const mockResponse = { category_id: 1, name: 'Category 1', groups: [1, 2, 3] };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type CategoryResponse = {
            category_id: number;
            name: string;
            groups: number[];
        };

        const result = await getBody(() => universeCategoryByIdApi.getCategoryById(1)) as CategoryResponse;
        expect(result).toHaveProperty('category_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('groups');
        expect(Array.isArray(result.groups)).toBe(true);
    });
});
