import { OpportunitiesClient } from '../../../src/clients/OpportunitiesClient';
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

const opportunitiesClient = new OpportunitiesClient(client);

describe('OpportunitiesClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for opportunities groups', async () => {
        const mockResponse = [{ group_id: 123, name: 'Group Name', description: 'Description' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await opportunitiesClient.getOpportunitiesGroups();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((group: { group_id: number; name: string; description: string }) => {
            expect(group).toHaveProperty('group_id');
            expect(typeof group.group_id).toBe('number');
            expect(group).toHaveProperty('name');
            expect(typeof group.name).toBe('string');
            expect(group).toHaveProperty('description');
            expect(typeof group.description).toBe('string');
        });
    });
});
