import { UniverseItemGroupsApi } from '../../../src/api/universe/getItemGroups';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseItemGroupsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeItemGroupsApi = new UniverseItemGroupsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getItemGroups', async () => {
        const mockResponse = [
            {
                group_id: 1,
                name: 'Group 1',
                description: 'Description 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type ItemGroupResponse = {
            group_id: number;
            name: string;
            description: string;
        };

        const result = await universeItemGroupsApi.getItemGroups() as ItemGroupResponse[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((group: ItemGroupResponse) => {
            expect(group).toHaveProperty('group_id');
            expect(typeof group.group_id).toBe('number');
            expect(group).toHaveProperty('name');
            expect(typeof group.name).toBe('string');
            expect(group).toHaveProperty('description');
            expect(typeof group.description).toBe('string');
        });
    });
});
