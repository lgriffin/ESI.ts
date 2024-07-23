import { PostFleetSquadApi } from '../../../src/api/fleets/postFleetSquad';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetSquadApi = new PostFleetSquadApi(client);

describe('PostFleetSquadApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should create a fleet squad', async () => {
        fetchMock.mockResponseOnce('', { status: 201 });

        const result = await fleetSquadApi.createFleetSquad(1234567890, 987654321);

        expect(result).toEqual({ error: 'created' });
    });
});
