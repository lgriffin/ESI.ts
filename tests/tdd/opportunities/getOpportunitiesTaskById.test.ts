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

    it('should return valid structure for opportunities task by ID', async () => {
        const mockResponse = { task_id: 123, name: 'Task Name', description: 'Description' };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => opportunitiesClient.getOpportunitiesTaskById(123)); // Replace with a valid task ID

        expect(result).toHaveProperty('task_id');
        expect(typeof result.task_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });
});
