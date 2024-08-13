import { GetLoyaltyPointsApi } from '../../../src/api/loyalty/getLoyaltyPoints';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const loyaltyPointsApi = new GetLoyaltyPointsApi(client);

describe('GetLoyaltyPointsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return loyalty points', async () => {
        const mockResponse = [
            {
                corporation_id: 123,
                loyalty_points: 1000
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => loyaltyPointsApi.getLoyaltyPoints(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((points: { corporation_id: number, loyalty_points: number }) => {
            expect(points).toHaveProperty('corporation_id');
            expect(typeof points.corporation_id).toBe('number');
            expect(points).toHaveProperty('loyalty_points');
            expect(typeof points.loyalty_points).toBe('number');
        });
    });
});
