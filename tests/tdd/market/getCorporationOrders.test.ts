import { getCorporationOrders } from '../../../src/api/market/getCorporationOrders';
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

const corporationOrdersApi = new getCorporationOrders(client);

describe('GetCorporationOrdersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation orders', async () => {
        const mockResponse = [
            {
                order_id: 123456,
                type_id: 1234,
                region_id: 10000002,
                location_id: 60003760,
                volume_total: 1000,
                volume_remain: 1000,
                price: 12.34,
                is_buy_order: false,
                issued: '2022-12-01T10:00:00Z',
                state: 'open',
                duration: 30,
                range: 'station'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationOrdersApi.getCorporationOrders(123456);

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
            expect(order).toHaveProperty('state');
            expect(order).toHaveProperty('duration');
            expect(order).toHaveProperty('range');
        });
    });
});
