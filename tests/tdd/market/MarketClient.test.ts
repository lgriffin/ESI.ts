import { MarketClient } from '../../../src/clients/MarketClient';
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

const marketClient = new MarketClient(client);

describe('MarketClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character orders', async () => {
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

        const result = await marketClient.getCharacterOrders(123456);

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

    it('should return character order history', async () => {
        const mockResponse = [
            {
                order_id: 1,
                type_id: 34,
                location_id: 60003760,
                volume_total: 1000,
                volume_remain: 0,
                price: 5.27,
                is_buy_order: true
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getCharacterOrderHistory(123456);

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

    it('should return corporation orders', async () => {
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

        const result = await marketClient.getCorporationOrders(123456);

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

    it('should return corporation order history', async () => {
        const mockResponse = [
            {
                order_id: 1,
                type_id: 34,
                location_id: 60003760,
                volume_total: 1000,
                volume_remain: 0,
                price: 5.27,
                is_buy_order: true
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getCorporationOrderHistory(123456);

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

    it('should return market history', async () => {
        const mockResponse = [
            {
                date: '2024-01-01',
                order_count: 100,
                volume: 1000,
                highest: 10.0,
                average: 9.0,
                lowest: 8.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getMarketHistory(123456, 678910);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((history: { date: string, order_count: number, volume: number, highest: number, average: number, lowest: number }) => {
            expect(history).toHaveProperty('date');
            expect(typeof history.date).toBe('string');
            expect(history).toHaveProperty('order_count');
            expect(typeof history.order_count).toBe('number');
            expect(history).toHaveProperty('volume');
            expect(typeof history.volume).toBe('number');
            expect(history).toHaveProperty('highest');
            expect(typeof history.highest).toBe('number');
            expect(history).toHaveProperty('average');
            expect(typeof history.average).toBe('number');
            expect(history).toHaveProperty('lowest');
            expect(typeof history.lowest).toBe('number');
        });
    });

    it('should return market orders', async () => {
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

        const result = await marketClient.getMarketOrders(123456);

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

    it('should return market types', async () => {
        const mockResponse = [34, 35, 36];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getMarketTypes(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((typeId: number) => {
            expect(typeof typeId).toBe('number');
        });
    });

    it('should return market groups', async () => {
        const mockResponse = [
            {
                market_group_id: 1,
                name: 'Group 1',
                description: 'Description 1',
                types: [123, 456]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getMarketGroups();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((group: { market_group_id: number, name: string, description: string, types: number[] }) => {
            expect(group).toHaveProperty('market_group_id');
            expect(typeof group.market_group_id).toBe('number');
            expect(group).toHaveProperty('name');
            expect(typeof group.name).toBe('string');
            expect(group).toHaveProperty('description');
            expect(typeof group.description).toBe('string');
            expect(group).toHaveProperty('types');
            expect(Array.isArray(group.types)).toBe(true);
        });
    });

    it('should return market group information', async () => {
        const mockResponse = {
            market_group_id: 1,
            name: 'Group 1',
            description: 'Description 1',
            types: [123, 456]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getMarketGroupInformation(1);

        expect(result).toHaveProperty('market_group_id');
        expect(typeof result.market_group_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
        expect(result).toHaveProperty('types');
        expect(Array.isArray(result.types)).toBe(true);
    });

    it('should return market prices', async () => {
        const mockResponse = [
            {
                type_id: 34,
                average_price: 5.27,
                adjusted_price: 5.50
            },
            {
                type_id: 35,
                average_price: 15.43,
                adjusted_price: 15.80
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketClient.getMarketPrices();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((price: { type_id: number, average_price: number, adjusted_price: number }) => {
            expect(price).toHaveProperty('type_id');
            expect(typeof price.type_id).toBe('number');
            expect(price).toHaveProperty('average_price');
            expect(typeof price.average_price).toBe('number');
            expect(price).toHaveProperty('adjusted_price');
            expect(typeof price.adjusted_price).toBe('number');
        });
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

        const result = await marketClient.getMarketOrdersInStructure(123456789);

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
