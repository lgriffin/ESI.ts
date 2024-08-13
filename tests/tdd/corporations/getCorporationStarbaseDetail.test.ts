import { GetCorporationStarbaseDetailApi } from '../../../src/api/corporations/getCorporationStarbaseDetail';
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

const api = new GetCorporationStarbaseDetailApi(client);

describe('GetCorporationStarbaseDetailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for starbase detail', async () => {
        const mockResponse = {
            starbase_id: 1234567890,
            type_id: 12345,
            system_id: 67890,
            moon_id: 112233,
            state: 'online',
            unanchor_at: '2024-01-01T00:00:00Z'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => api.getCorporationStarbaseDetail(123456, 1234567890));

        expect(result).toHaveProperty('starbase_id');
        expect(typeof result.starbase_id).toBe('number');
        expect(result).toHaveProperty('type_id');
        expect(typeof result.type_id).toBe('number');
        expect(result).toHaveProperty('system_id');
        expect(typeof result.system_id).toBe('number');
        expect(result).toHaveProperty('moon_id');
        expect(typeof result.moon_id).toBe('number');
        expect(result).toHaveProperty('state');
        expect(typeof result.state).toBe('string');
        expect(result).toHaveProperty('unanchor_at');
        expect(typeof result.unanchor_at).toBe('string');
    });
});
