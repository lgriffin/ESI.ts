import { GetFleetInfoApi } from '../../../src/api/fleets/getFleetInfo';

import fetchMock from 'jest-fetch-mock';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

fetchMock.enableMocks();

const fleetInfoApi = new GetFleetInfoApi(client);

describe('GetFleetInfoApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid fleet info', async () => {
        const mockResponse = {
            fleet_id: 1234567890,
            name: 'Test Fleet',
            is_free_move: true,
            is_registered: false,
            is_voice_enabled: true
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetInfoApi.getFleetInfo(1234567890);

        expect(result).toHaveProperty('fleet_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('is_free_move');
        expect(result).toHaveProperty('is_registered');
        expect(result).toHaveProperty('is_voice_enabled');
    });
});
