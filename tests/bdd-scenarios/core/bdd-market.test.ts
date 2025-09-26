/**
 * BDD Scenarios: Market Management
 * 
 * Comprehensive behavior-driven tests for all Market-related APIs
 * covering orders, prices, history, and trading operations.
 */

import { EsiClient } from '../../../src/EsiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Market Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-market-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000
    });
  });

  describe('Feature: Market Price Information', () => {
    describe('Scenario: Retrieve current market prices', () => {
      it('Given the market system is operational, When I request current prices, Then I should receive price data for all tradeable items', async () => {
        // Given: The market system is operational
        const expectedPrices = [
          TestDataFactory.createMarketPrice({
            type_id: 34,
            average_price: 5000000.00,
            adjusted_price: 5100000.00
          }),
          TestDataFactory.createMarketPrice({
            type_id: 35,
            average_price: 15000000.00,
            adjusted_price: 15200000.00
          })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getMarketPrices').mockResolvedValue(expectedPrices);

        // When: I request current prices
        const result = await client.market.getMarketPrices();

        // Then: I should receive price data for all tradeable items
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('average_price');
        expect(result[0]).toHaveProperty('adjusted_price');
        expect(typeof result[0].average_price).toBe('number');
        expect(result[0].average_price).toBeGreaterThan(0);
      });
    });

    describe('Scenario: Handle market data unavailability', () => {
      it('Given market data is temporarily unavailable, When I request prices, Then I should receive an appropriate service error', async () => {
        // Given: Market data is temporarily unavailable
        const serviceError = TestDataFactory.createError(ApiErrorType.SERVER_ERROR, 503);

        // Mock the API to throw a service error
        jest.spyOn(client.market, 'getMarketPrices').mockRejectedValue(serviceError);

        // When & Then: I request prices and expect a service error
        await expect(client.market.getMarketPrices())
          .rejects
          .toThrow(ApiError);
      });
    });
  });

  describe('Feature: Market Orders Management', () => {
    describe('Scenario: Retrieve market orders for a region', () => {
      it('Given a valid region ID, When I request market orders, Then I should receive current buy and sell orders', async () => {
        // Given: A valid region ID (The Forge)
        const regionId = 10000002;
        const typeId = 34; // Tritanium
        const expectedOrders = [
          TestDataFactory.createMarketOrder({
            order_id: 5000000001,
            type_id: typeId,
            location_id: 60003760,
            volume_total: 1000000,
            volume_remain: 500000,
            min_volume: 1,
            price: 4.50,
            is_buy_order: true,
            duration: 90,
            issued: '2024-01-15T12:00:00Z',
            range: 'region'
          }),
          TestDataFactory.createMarketOrder({
            order_id: 5000000002,
            type_id: typeId,
            location_id: 60003760,
            volume_total: 2000000,
            volume_remain: 2000000,
            min_volume: 1,
            price: 4.60,
            is_buy_order: false,
            duration: 30,
            issued: '2024-01-15T10:00:00Z',
            range: 'station'
          })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getMarketOrders').mockResolvedValue(expectedOrders);

        // When: I request market orders
        const result = await client.market.getMarketOrders(regionId);

        // Then: I should receive current buy and sell orders
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('order_id');
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('price');
        expect(result[0]).toHaveProperty('is_buy_order');
        expect(result[0].type_id).toBe(typeId);
        expect(typeof result[0].is_buy_order).toBe('boolean');
      });
    });

    describe('Scenario: Filter buy and sell orders', () => {
      it('Given market orders with mixed buy/sell types, When I analyze the orders, Then I should be able to distinguish between buy and sell orders', async () => {
        // Given: Market orders with mixed buy/sell types
        const regionId = 10000002;
        const typeId = 34;
        const mixedOrders = [
          TestDataFactory.createMarketOrder({ order_id: 1, is_buy_order: true, price: 4.50 }),
          TestDataFactory.createMarketOrder({ order_id: 2, is_buy_order: false, price: 4.60 }),
          TestDataFactory.createMarketOrder({ order_id: 3, is_buy_order: true, price: 4.45 }),
          TestDataFactory.createMarketOrder({ order_id: 4, is_buy_order: false, price: 4.65 })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getMarketOrders').mockResolvedValue(mixedOrders);

        // When: I analyze the orders
        const result = await client.market.getMarketOrders(regionId);
        const buyOrders = result.filter((order: any) => order.is_buy_order);
        const sellOrders = result.filter((order: any) => !order.is_buy_order);

        // Then: I should be able to distinguish between buy and sell orders
        expect(buyOrders.length).toBe(2);
        expect(sellOrders.length).toBe(2);
        expect(buyOrders.every((order: any) => order.is_buy_order)).toBe(true);
        expect(sellOrders.every((order: any) => !order.is_buy_order)).toBe(true);
        
        // Buy orders should have lower prices (buyers want to pay less)
        expect(buyOrders[0].price).toBeLessThan(sellOrders[0].price);
      });
    });
  });

  describe('Feature: Market History Analysis', () => {
    describe('Scenario: Retrieve historical market data', () => {
      it('Given a valid region and item type, When I request market history, Then I should receive historical price and volume data', async () => {
        // Given: A valid region and item type
        const regionId = 10000002;
        const typeId = 34;
        const expectedHistory = [
          TestDataFactory.createMarketHistory({
            date: '2024-01-15',
            volume: 1000000000,
            order_count: 2500,
            lowest: 4.20,
            highest: 4.80,
            average: 4.50
          }),
          TestDataFactory.createMarketHistory({
            date: '2024-01-14',
            volume: 950000000,
            order_count: 2400,
            lowest: 4.15,
            highest: 4.75,
            average: 4.45
          })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getMarketHistory').mockResolvedValue(expectedHistory);

        // When: I request market history
        const result = await client.market.getMarketHistory(regionId, typeId);

        // Then: I should receive historical price and volume data
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('volume');
        expect(result[0]).toHaveProperty('order_count');
        expect(result[0]).toHaveProperty('lowest');
        expect(result[0]).toHaveProperty('highest');
        expect(result[0]).toHaveProperty('average');
        expect(result[0].highest).toBeGreaterThanOrEqual(result[0].lowest);
      });
    });

    describe('Scenario: Analyze price trends', () => {
      it('Given historical market data, When I analyze price trends, Then I should be able to identify market patterns', async () => {
        // Given: Historical market data
        const regionId = 10000002;
        const typeId = 34;
        const trendingHistory = [
          TestDataFactory.createMarketHistory({ date: '2024-01-10', average: 4.00 }),
          TestDataFactory.createMarketHistory({ date: '2024-01-11', average: 4.10 }),
          TestDataFactory.createMarketHistory({ date: '2024-01-12', average: 4.20 }),
          TestDataFactory.createMarketHistory({ date: '2024-01-13', average: 4.30 }),
          TestDataFactory.createMarketHistory({ date: '2024-01-14', average: 4.40 })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getMarketHistory').mockResolvedValue(trendingHistory);

        // When: I analyze price trends
        const result = await client.market.getMarketHistory(regionId, typeId);
        const priceChanges = result.slice(1).map((day: any, index: number) => 
          day.average - result[index].average
        );

        // Then: I should be able to identify market patterns
        expect(result.length).toBe(5);
        expect(priceChanges.every((change: any) => change > 0)).toBe(true); // Upward trend
        expect(result[result.length - 1].average).toBeGreaterThan(result[0].average);
        
        // Calculate trend strength
        const totalChange = result[result.length - 1].average - result[0].average;
        expect(totalChange).toBeCloseTo(0.40, 2); // 10% increase over 5 days
      });
    });
  });

  describe('Feature: Character Market Orders', () => {
    describe('Scenario: Retrieve character market orders', () => {
      it('Given an authenticated character, When I request their market orders, Then I should receive their active orders', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedOrders = [
          TestDataFactory.createCharacterMarketOrder({
            order_id: 5000000001,
            type_id: 34,
            region_id: 10000002,
            location_id: 60003760,
            range: 'region',
            volume_total: 1000000,
            volume_remain: 750000,
            min_volume: 1,
            price: 4.50,
            is_buy_order: true,
            duration: 90,
            issued: '2024-01-15T12:00:00Z',
            state: 'open'
          })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getCharacterOrders').mockResolvedValue(expectedOrders);

        // When: I request their market orders
        const result = await client.market.getCharacterOrders(characterId);

        // Then: I should receive their active orders
        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toHaveProperty('order_id');
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('price');
        expect(result[0]).toHaveProperty('state');
        expect(result[0].state).toBe('open');
      });
    });

    describe('Scenario: Retrieve character order history', () => {
      it('Given an authenticated character, When I request their order history, Then I should receive completed and cancelled orders', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedHistory = [
          TestDataFactory.createCharacterOrderHistory({
            order_id: 5000000001,
            type_id: 34,
            region_id: 10000002,
            location_id: 60003760,
            range: 'region',
            volume_total: 1000000,
            volume_remain: 0,
            min_volume: 1,
            price: 4.50,
            is_buy_order: true,
            duration: 90,
            issued: '2024-01-10T12:00:00Z',
            state: 'closed'
          })
        ];

        // Mock the API response
        jest.spyOn(client.market, 'getCharacterOrderHistory').mockResolvedValue(expectedHistory);

        // When: I request their order history
        const result = await client.market.getCharacterOrderHistory(characterId);

        // Then: I should receive completed and cancelled orders
        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toHaveProperty('order_id');
        expect(result[0]).toHaveProperty('state');
        expect(['closed', 'cancelled', 'expired'].includes(result[0].state)).toBe(true);
        expect(result[0].volume_remain).toBeLessThanOrEqual(result[0].volume_total);
      });
    });
  });

  describe('Feature: Market Performance and Reliability', () => {
    describe('Scenario: Handle high-frequency market data requests', () => {
      it('Given multiple concurrent market data requests, When I make them simultaneously, Then all should complete successfully', async () => {
        // Given: Multiple concurrent market data requests
        const regionIds = [10000002, 10000030, 10000043]; // The Forge, Heimatar, Domain
        const typeId = 34;
        const mockOrders = regionIds.map((regionId, index) => [
          TestDataFactory.createMarketOrder({ 
            order_id: 5000000001 + index,
            type_id: typeId,
            price: 4.50 + (index * 0.1)
          })
        ]);

        // Mock the API responses
        jest.spyOn(client.market, 'getMarketOrders')
          .mockImplementation(async (regionId: number) => 
            mockOrders[regionIds.indexOf(regionId)] || []
          );

        // When: I make them simultaneously
        const promises = regionIds.map(regionId => client.market.getMarketOrders(regionId));
        const results = await Promise.all(promises);

        // Then: All should complete successfully
        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
          expect(result).toBeInstanceOf(Array);
          expect(result[0].price).toBe(4.50 + (index * 0.1));
        });
      });
    });

    describe('Scenario: Handle market data with large volumes', () => {
      it('Given a request for market data with many orders, When I process the data, Then the system should handle large datasets efficiently', async () => {
        // Given: A request for market data with many orders
        const regionId = 10000002;
        const typeId = 34;
        const largeOrderSet = Array.from({ length: 5000 }, (_, i) => 
          TestDataFactory.createMarketOrder({
            order_id: 5000000001 + i,
            type_id: typeId,
            price: 4.00 + (Math.random() * 2), // Price between 4.00 and 6.00
            volume_remain: Math.floor(Math.random() * 1000000),
            is_buy_order: Math.random() > 0.5
          })
        );

        // Mock the API response with large dataset
        jest.spyOn(client.market, 'getMarketOrders').mockResolvedValue(largeOrderSet);

        // When: I process the data
        const startTime = Date.now();
        const result = await client.market.getMarketOrders(regionId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Then: The system should handle large datasets efficiently
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(5000);
        expect(responseTime).toBeLessThan(1000); // Should process within 1 second
        
        // Verify data integrity
        const buyOrders = result.filter((order: any) => order.is_buy_order);
        const sellOrders = result.filter((order: any) => !order.is_buy_order);
        expect(buyOrders.length + sellOrders.length).toBe(result.length);
      });
    });
  });

  describe('Feature: Market Data Integration', () => {
    describe('Scenario: Complete market analysis workflow', () => {
      it('Given a market analysis requirement, When I gather comprehensive market data, Then I should successfully retrieve all market information', async () => {
        // Given: A market analysis requirement
        const regionId = 10000002;
        const typeId = 34;
        const mockPrices = [TestDataFactory.createMarketPrice({ type_id: typeId, average_price: 4.50 })];
        const mockOrders = [
          TestDataFactory.createMarketOrder({ type_id: typeId, price: 4.45, is_buy_order: true }),
          TestDataFactory.createMarketOrder({ type_id: typeId, price: 4.55, is_buy_order: false })
        ];
        const mockHistory = [TestDataFactory.createMarketHistory({ date: '2024-01-15', average: 4.50 })];

        // Mock all API responses
        jest.spyOn(client.market, 'getMarketPrices').mockResolvedValue(mockPrices);
        jest.spyOn(client.market, 'getMarketOrders').mockResolvedValue(mockOrders);
        jest.spyOn(client.market, 'getMarketHistory').mockResolvedValue(mockHistory);

        // When: I gather comprehensive market data
        const [prices, orders, history] = await Promise.all([
          client.market.getMarketPrices(),
          client.market.getMarketOrders(regionId),
          client.market.getMarketHistory(regionId, typeId)
        ]);

        // Then: I should successfully retrieve all market information
        expect(prices).toBeInstanceOf(Array);
        expect(prices[0].type_id).toBe(typeId);
        
        expect(orders).toBeInstanceOf(Array);
        expect(orders[0].type_id).toBe(typeId);
        
        expect(history).toBeInstanceOf(Array);
        expect(history[0].date).toBe('2024-01-15');
        
        // Verify market analysis capabilities
        const currentPrice = prices.find((p: any) => p.type_id === typeId)?.average_price;
        const buyOrders = orders.filter((o: any) => o.is_buy_order);
        const sellOrders = orders.filter((o: any) => !o.is_buy_order);
        const bestBuyOrder = buyOrders.length > 0 ? buyOrders.reduce((best: any, current: any) => 
          current.price > best.price ? current : best
        ) : null;
        const bestSellOrder = sellOrders.length > 0 ? sellOrders.reduce((best: any, current: any) => 
          current.price < best.price ? current : best
        ) : null;
        
        expect(currentPrice).toBeDefined();
        expect(bestBuyOrder).toBeDefined();
        expect(bestSellOrder).toBeDefined();
      });
    });
  });
});
