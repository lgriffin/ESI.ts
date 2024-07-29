import { PostAutopilotWaypointApi } from '../../../src/api/ui/postAutopilotWaypoint';
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

const autopilotWaypointApi = new PostAutopilotWaypointApi(client);

describe('PostAutopilotWaypointApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should set autopilot waypoint', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            destination_id: 30002505,
            clear_other_waypoints: true,
            add_to_beginning: false
        };

        const result = await autopilotWaypointApi.setAutopilotWaypoint(body);

        expect(result).toEqual({ error: 'no content' });
    });
});
