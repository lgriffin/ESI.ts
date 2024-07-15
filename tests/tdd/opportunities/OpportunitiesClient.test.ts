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

    it('should return valid structure for character opportunities', async () => {
        const mockResponse = [{ task_id: 123, completed_at: '2024-07-01T18:57:11Z' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await opportunitiesClient.getCharacterOpportunities(12345); // Replace with a valid character ID

        expect(Array.isArray(result)).toBe(true);
        result.forEach((opportunity: { task_id: number; completed_at: string }) => {
            expect(opportunity).toHaveProperty('task_id');
            expect(typeof opportunity.task_id).toBe('number');
            expect(opportunity).toHaveProperty('completed_at');
            expect(typeof opportunity.completed_at).toBe('string');
        });
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

    it('should return valid structure for opportunities group by ID', async () => {
        const mockResponse = { group_id: 123, name: 'Group Name', description: 'Description', tasks: [1, 2, 3] };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await opportunitiesClient.getOpportunitiesGroupById(123); // Replace with a valid group ID

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

    it('should return valid structure for opportunities tasks', async () => {
        const mockResponse = [{ task_id: 123, name: 'Task Name', description: 'Description' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await opportunitiesClient.getOpportunitiesTasks();

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

    it('should return valid structure for opportunities task by ID', async () => {
        const mockResponse = { task_id: 123, name: 'Task Name', description: 'Description' };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await opportunitiesClient.getOpportunitiesTaskById(123); // Replace with a valid task ID

        expect(result).toHaveProperty('task_id');
        expect(typeof result.task_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });
});
