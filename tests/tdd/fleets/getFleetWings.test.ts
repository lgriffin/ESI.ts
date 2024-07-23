import { GetFleetWingsApi } from '../../../src/api/fleets/getFleetWings';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const fleetWingsApi = new GetFleetWingsApi(client);

describe('GetFleetWingsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return fleet wings', async () => {
        const mockResponse: { wing_id: number; name: string }[] = [
            {
                wing_id: 1,
                name: 'Wing 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetWingsApi.getFleetWings(1234567890);

        expect(Array.isArray(result)).toBe(true);
        (result as { wing_id: number; name: string }[]).forEach(wing => {
            expect(wing).toHaveProperty('wing_id');
            expect(typeof wing.wing_id).toBe('number');
            expect(wing).toHaveProperty('name');
            expect(typeof wing.name).toBe('string');
        });
    });
});
