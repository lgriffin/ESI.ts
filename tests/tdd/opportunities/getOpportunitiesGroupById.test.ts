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

    it('should return valid structure for opportunities group by ID', async () => {
        const mockResponse = { group_id: 123, name: 'Group Name', description: 'Description', tasks: [1, 2, 3] };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => opportunitiesClient.getOpportunitiesGroupById(123)); // Replace with a valid group ID

        expect(result).toHaveProperty('group_id');
        expect(typeof result.group_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
        expect(result).toHaveProperty('tasks');
        expect(Array.isArray(result.tasks)).toBe(true);
        result.tasks.forEach((task: number) => {
            expect(typeof task).toBe('number');
        });
    });
});
