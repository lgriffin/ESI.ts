import { LoyaltyClient } from '../../../src/clients/LoyaltyClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const loyaltyClient = new LoyaltyClient(client);

describe('LoyaltyClient', () => {
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

        const result = await getBody(() => loyaltyClient.getLoyaltyPoints(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((points: { corporation_id: number, loyalty_points: number }) => {
            expect(points).toHaveProperty('corporation_id');
            expect(typeof points.corporation_id).toBe('number');
            expect(points).toHaveProperty('loyalty_points');
            expect(typeof points.loyalty_points).toBe('number');
        });
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

        const result = await getBody(() => loyaltyClient.getLoyaltyStoreOffers(123));

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
