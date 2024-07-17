import { GetAgentsResearchApi } from '../../../src/api/characters/getAgentsResearch';
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

const agentsResearchApi = new GetAgentsResearchApi(client);

describe('GetAgentsResearchApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for agents research', async () => {
        const mockResponse = [
            {
                agent_id: 3009358,
                skill_type_id: 11450,
                research_start_date: '2024-01-01T00:00:00Z',
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await agentsResearchApi.getAgentsResearch(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((research) => {
            expect(research).toHaveProperty('agent_id');
            expect(research).toHaveProperty('skill_type_id');
            expect(research).toHaveProperty('research_start_date');
        });
    });
});
