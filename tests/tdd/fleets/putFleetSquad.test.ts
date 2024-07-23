import { PutFleetSquadApi } from '../../../src/api/fleets/putFleetSquad';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetSquadApi = new PutFleetSquadApi(client);

describe('PutFleetSquadApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should rename a fleet squad', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const body = {
            name: 'New Squad Name'
        };

        const result = await fleetSquadApi.renameFleetSquad(1234567890, 123456789, body);

        expect(result).toEqual({ error: 'no content' });
    });
});
