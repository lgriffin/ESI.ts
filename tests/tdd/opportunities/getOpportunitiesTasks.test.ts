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

    it('should return valid structure for opportunities tasks', async () => {
        const mockResponse = [{ task_id: 123, name: 'Task Name', description: 'Description' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => opportunitiesClient.getOpportunitiesTasks());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((task: { task_id: number; name: string; description: string }) => {
            expect(task).toHaveProperty('task_id');
            expect(typeof task.task_id).toBe('number');
            expect(task).toHaveProperty('name');
            expect(typeof task.name).toBe('string');
            expect(task).toHaveProperty('description');
            expect(typeof task.description).toBe('string');
        });
    });
});
