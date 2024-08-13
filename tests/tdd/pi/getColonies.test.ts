import { GetColoniesApi } from '../../../src/api/pi/getColonies';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const coloniesApi = new GetColoniesApi(client);

describe('GetColoniesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return colonies', async () => {
        const mockResponse = [
            {
                planet_id: 123456,
                planet_type: 'temperate',
                owner_id: 987654,
                system_id: 654321,
                last_update: '2024-01-01T00:00:00Z',
                num_pins: 10,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => coloniesApi.getColonies(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((colony: { planet_id: number, planet_type: string, owner_id: number, system_id: number, last_update: string, num_pins: number }) => {
            expect(colony).toHaveProperty('planet_id');
            expect(typeof colony.planet_id).toBe('number');
            expect(colony).toHaveProperty('planet_type');
            expect(typeof colony.planet_type).toBe('string');
            expect(colony).toHaveProperty('owner_id');
            expect(typeof colony.owner_id).toBe('number');
            expect(colony).toHaveProperty('system_id');
            expect(typeof colony.system_id).toBe('number');
            expect(colony).toHaveProperty('last_update');
            expect(typeof colony.last_update).toBe('string');
            expect(colony).toHaveProperty('num_pins');
            expect(typeof colony.num_pins).toBe('number');
        });
    });
});
