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

        const result = await getBody(() => opportunitiesClient.getCharacterOpportunities(1689391488));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((opportunity: { task_id: number; completed_at: string }) => {
            expect(opportunity).toHaveProperty('task_id');
            expect(typeof opportunity.task_id).toBe('number');
            expect(opportunity).toHaveProperty('completed_at');
            expect(typeof opportunity.completed_at).toBe('string');
        });
    });
});
