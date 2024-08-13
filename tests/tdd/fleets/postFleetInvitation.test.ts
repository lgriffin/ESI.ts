import { PostFleetInvitationApi } from '../../../src/api/fleets/postFleetInvitation';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetInvitationApi = new PostFleetInvitationApi(client);

describe('PostFleetInvitationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should create a fleet invitation', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const body = {
            character_id: 123456,
            role: 'fleet_commander'
        };

        const result = await getBody(() => fleetInvitationApi.createFleetInvitation(1234567890, body));

        expect(result).toEqual({ error: 'no content' });
    });
});
