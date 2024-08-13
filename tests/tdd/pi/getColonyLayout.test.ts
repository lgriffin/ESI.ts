import { GetColonyLayoutApi } from '../../../src/api/pi/getColonyLayout';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const colonyLayoutApi = new GetColonyLayoutApi(client);

describe('GetColonyLayoutApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return colony layout', async () => {
        const mockResponse = {
            links: [
                { source_pin_id: 1001, destination_pin_id: 1002, link_level: 1 }
            ],
            pins: [
                {
                    pin_id: 1001,
                    type_id: 3001,
                    latitude: 0.5,
                    longitude: -0.5,
                    schematic_id: 4001,
                }
            ],
            routes: [
                { route_id: 2001, source_pin_id: 1001, destination_pin_id: 1002, content_type_id: 3001, quantity: 500 }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => colonyLayoutApi.getColonyLayout(123456, 654321));

        expect(result).toHaveProperty('links');
        expect(Array.isArray(result.links)).toBe(true);
        expect(result).toHaveProperty('pins');
        expect(Array.isArray(result.pins)).toBe(true);
        expect(result).toHaveProperty('routes');
        expect(Array.isArray(result.routes)).toBe(true);
    });
});
