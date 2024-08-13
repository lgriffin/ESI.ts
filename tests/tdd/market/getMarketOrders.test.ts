import { getMarketOrders } from '../../../src/api/market/getMarketOrders';
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

const marketOrdersApi = new getMarketOrders(client);

describe('GetMarketOrdersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market orders', async () => {
        const mockResponse = [
            {
                order_id: 123456,
                type_id: 34,
                region_id: 10000002,
                location_id: 60003760,
                volume_total: 1000,
                volume_remain: 500,
                price: 12.34,
                is_buy_order: false,
                issued: '2023-01-01T10:00:00Z',
                duration: 30,
                range: 'region'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => marketOrdersApi.getMarketOrders(10000002));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(order => {
            expect(order).toHaveProperty('order_id');
            expect(order).toHaveProperty('type_id');
            expect(order).toHaveProperty('region_id');
            expect(order).toHaveProperty('location_id');
            expect(order).toHaveProperty('volume_total');
            expect(order).toHaveProperty('volume_remain');
            expect(order).toHaveProperty('price');
            expect(order).toHaveProperty('is_buy_order');
            expect(order).toHaveProperty('issued');
            expect(order).toHaveProperty('duration');
            expect(order).toHaveProperty('range');
        });
    });
});
