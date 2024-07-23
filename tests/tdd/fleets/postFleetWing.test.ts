import { PostFleetWingApi } from '../../../src/api/fleets/postFleetWing';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetWingApi = new PostFleetWingApi(client);

describe('PostFleetWingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should create a fleet wing', async () => {
        const mockResponse = {
            wing_id: 123456789
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            name: 'New Wing'
        };

        const result = await fleetWingApi.createFleetWing(1234567890, body);

        expect(result).toHaveProperty('wing_id');
        expect(typeof result.wing_id).toBe('number');
    });
});
