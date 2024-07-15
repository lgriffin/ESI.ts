import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { IncursionsApiBuilder } from '../../../src/builders/IncursionsApiBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('IncursionsClient', () => {
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

        const incursionsClient = new IncursionsApiBuilder(client).build();

        const incursions = await incursionsClient.getIncursions();
        expect(incursions).toEqual(mockResponse);
    });
});
