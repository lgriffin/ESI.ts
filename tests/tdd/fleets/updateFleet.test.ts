import { UpdateFleetApi } from '../../../src/api/fleets/updateFleet';
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

const updateFleetApi = new UpdateFleetApi(client);

describe('UpdateFleetApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should update the fleet information', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const body = {
            is_free_move: false,
            is_registered: true,
            is_voice_enabled: false,
            motd: 'Fleet Message of the Day'
        };

        const result = await getBody(() => updateFleetApi.updateFleet(1234567890, body));

        expect(result).toEqual({ error: 'no content' });
    });
});
