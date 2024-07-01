import { UniverseTypeByIdApi } from '../../../src/api/universe/getTypeById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseTypeByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeTypeByIdApi = new UniverseTypeByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getTypeById', async () => {
        const mockResponse = {
            type_id: 12345,
            name: 'Some Type',
            description: 'Description of the type',
            published: true,
            group_id: 456
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type TypeResponse = {
            type_id: number;
            name: string;
            description: string;
            published: boolean;
            group_id: number;
        };

        const result = await universeTypeByIdApi.getTypeById(12345) as TypeResponse;

        expect(result).toHaveProperty('type_id');
        expect(typeof result.type_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
        expect(result).toHaveProperty('published');
        expect(typeof result.published).toBe('boolean');
        expect(result).toHaveProperty('group_id');
        expect(typeof result.group_id).toBe('number');
    });
});
