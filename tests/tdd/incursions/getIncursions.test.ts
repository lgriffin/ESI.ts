import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { IncursionsApi } from '../../../src/api/incursions/getIncursions';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('IncursionsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should fetch incursions correctly', async () => {
        const mockResponse = [
            {
                constellation_id: 20000169,
                faction_id: 500019,
                has_boss: true,
                infested_solar_systems: [30001161, 30001162],
                influence: 0.9,
                staging_solar_system_id: 30001161,
                state: 'mobilizing',
                type: 'Incursion'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const incursionsApi = new IncursionsApi(client);

        const result = await getBody(() => incursionsApi.getIncursions());
        expect(result).toEqual(mockResponse);
    });
});
