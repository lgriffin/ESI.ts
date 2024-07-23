import { DeleteFleetMemberApi } from '../../../src/api/fleets/deleteFleetMember';
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

const fleetMemberApi = new DeleteFleetMemberApi(client);

describe('DeleteFleetMemberApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should kick a fleet member', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const result = await fleetMemberApi.kickFleetMember(1234567890, 123456789);

        expect(result).toEqual({ error: 'no content' });
    });
});
