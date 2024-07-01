import { UniverseItemGroupByIdApi } from '../../../src/api/universe/getItemGroupById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseItemGroupByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeItemGroupByIdApi = new UniverseItemGroupByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getItemGroupById', async () => {
        const mockResponse = {
            group_id: 1,
            name: 'Group 1',
            description: 'Description 1'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type ItemGroupResponse = {
            group_id: number;
            name: string;
            description: string;
        };

        const result = await universeItemGroupByIdApi.getItemGroupById(1) as ItemGroupResponse;

        expect(result).toHaveProperty('group_id');
        expect(typeof result.group_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });
});
