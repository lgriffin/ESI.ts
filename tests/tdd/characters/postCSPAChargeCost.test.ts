import { PostCspaChargeCostApi } from '../../../src/api/characters/postCSPAChargeCost';
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

const cspaChargeCostApi = new PostCspaChargeCostApi(client);

describe('PostCspaChargeCostApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for CSPA charge cost', async () => {
        const mockResponse = {
            cost: 123456.78
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            characters: [1234567890, 1234567891]
        };

        // Explicitly defining the type inline
        const result = await getBody(() => cspaChargeCostApi.calculateCspaChargeCost(123456, body)) as { cost: number };

        expect(result).toHaveProperty('cost');
        expect(typeof result.cost).toBe('number');
    });
});
