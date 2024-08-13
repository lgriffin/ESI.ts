import { DeleteFleetSquadApi } from '../../../src/api/fleets/deleteFleetSquad';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetSquadApi = new DeleteFleetSquadApi(client);

describe('DeleteFleetSquadApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete a fleet squad', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const result = await getBody(() => fleetSquadApi.deleteFleetSquad(1234567890, 123456789));

        expect(result).toEqual({ error: 'no content' });
    });
});
