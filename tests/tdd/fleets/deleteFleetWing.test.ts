import { DeleteFleetWingApi } from '../../../src/api/fleets/deleteFleetWing';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetWingApi = new DeleteFleetWingApi(client);

describe('DeleteFleetWingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should delete a fleet wing', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const result = await fleetWingApi.deleteFleetWing(1234567890, 123456789);

        expect(result).toEqual({ error: 'no content' });
    });
});
