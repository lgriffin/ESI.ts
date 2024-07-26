import { GetLoyaltyStoreOffersApi } from '../../../src/api/loyalty/getLoyaltyStoreOffers';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const loyaltyStoreOffersApi = new GetLoyaltyStoreOffersApi(client);

describe('GetLoyaltyStoreOffersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return loyalty store offers', async () => {
        const mockResponse = [
            {
                offer_id: 1,
                lp_cost: 100,
                isk_cost: 1000,
                item_id: 12345,
                quantity: 10
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await loyaltyStoreOffersApi.getLoyaltyStoreOffers(123);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((offer: { offer_id: number, lp_cost: number, isk_cost: number, item_id: number, quantity: number }) => {
            expect(offer).toHaveProperty('offer_id');
            expect(typeof offer.offer_id).toBe('number');
            expect(offer).toHaveProperty('lp_cost');
            expect(typeof offer.lp_cost).toBe('number');
            expect(offer).toHaveProperty('isk_cost');
            expect(typeof offer.isk_cost).toBe('number');
            expect(offer).toHaveProperty('item_id');
            expect(typeof offer.item_id).toBe('number');
            expect(offer).toHaveProperty('quantity');
            expect(typeof offer.quantity).toBe('number');
        });
    });
});
