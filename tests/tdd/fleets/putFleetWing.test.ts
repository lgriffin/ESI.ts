import { PutFleetWingApi } from '../../../src/api/fleets/putFleetWing';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetWingApi = new PutFleetWingApi(client);

describe('PutFleetWingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should rename a fleet wing', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetWingApi.renameFleetWing(1234567890, 987654321, 'New Wing Name');

        expect(result).toEqual({ error: 'no content' });
    });
});
