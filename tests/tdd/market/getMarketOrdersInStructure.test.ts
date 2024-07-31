import { getMarketOrdersInStructure } from '../../../src/api/market/getMarketOrdersInStructure';
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

const marketOrdersInStructureApi = new getMarketOrdersInStructure(client);

describe('GetMarketOrdersInStructureApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market orders in a structure', async () => {
        const mockResponse = [
            {
                order_id: 1,
                type_id: 34,
                location_id: 60003760,
                volume_total: 1000,
                volume_remain: 500,
                price: 5.27,
                is_buy_order: true
            },
            {
                order_id: 2,
                type_id: 35,
                location_id: 60003760,
                volume_total: 2000,
                volume_remain: 1500,
                price: 15.43,
                is_buy_order: false
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketOrdersInStructureApi.getMarketOrdersInStructure(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((order: { order_id: number, type_id: number, location_id: number, volume_total: number, volume_remain: number, price: number, is_buy_order: boolean }) => {
            expect(order).toHaveProperty('order_id');
            expect(typeof order.order_id).toBe('number');
            expect(order).toHaveProperty('type_id');
            expect(typeof order.type_id).toBe('number');
            expect(order).toHaveProperty('location_id');
            expect(typeof order.location_id).toBe('number');
            expect(order).toHaveProperty('volume_total');
            expect(typeof order.volume_total).toBe('number');
            expect(order).toHaveProperty('volume_remain');
            expect(typeof order.volume_remain).toBe('number');
            expect(order).toHaveProperty('price');
            expect(typeof order.price).toBe('number');
            expect(order).toHaveProperty('is_buy_order');
            expect(typeof order.is_buy_order).toBe('boolean');
        });
    });
});
