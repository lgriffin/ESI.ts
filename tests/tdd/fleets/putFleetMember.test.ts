import { PutFleetMemberApi } from '../../../src/api/fleets/putFleetMember';
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

const fleetMemberApi = new PutFleetMemberApi(client);

describe('PutFleetMemberApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should move a fleet member', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const body = {
            role: 'squad_commander',
            squad_id: 987654321,
            wing_id: 123456789
        };

        const result = await getBody(() => fleetMemberApi.moveFleetMember(1234567890, 123456789, body));

        expect(result).toEqual({ error: 'no content' });
    });
});
