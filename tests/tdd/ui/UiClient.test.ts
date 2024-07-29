import { UIClient } from '../../../src/clients/UiClient';
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

const uiClient = new UIClient(client);

describe('UiClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should set autopilot waypoint', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({}));

        const response = await uiClient.setAutopilotWaypoint({
            destination_id: 30002505,
            clear_other_waypoints: true,
            add_to_beginning: false
        });

        expect(response).toEqual({});
    });

    // Add other tests...
});
