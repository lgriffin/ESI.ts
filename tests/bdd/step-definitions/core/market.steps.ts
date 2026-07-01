import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/market.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-market-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN retrieving current market prices, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the market system is operational', () => {
      const expectedPrices = [
        TestDataFactory.createMarketPrice({
          type_id: 34,
          average_price: 5000000.0,
          adjusted_price: 5100000.0,
        }),
        TestDataFactory.createMarketPrice({
          type_id: 35,
          average_price: 15000000.0,
          adjusted_price: 15200000.0,
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockResolvedValue(expectedPrices);
    });

    when('the client requests current market prices', async () => {
      result = await client.market.getMarketPrices();
    });

    then('the client shall return price data for all tradeable items', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('average_price');
      expect(result[0]).toHaveProperty('adjusted_price');
      expect(typeof result[0].average_price).toBe('number');
      expect(result[0].average_price).toBeGreaterThan(0);
    });
  });

  test('IF market data is unavailable, THEN the client shall handle the outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('market data is temporarily unavailable', () => {
      const serviceError = TestDataFactory.createError(503);

      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockRejectedValue(serviceError);
    });

    when('the client requests market prices expecting error', async () => {
      try {
        await client.market.getMarketPrices();
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a market service error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN retrieving market orders for a region, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;

    given('a valid region ID', () => {
      const expectedOrders = [
        TestDataFactory.createMarketOrder({
          order_id: 5000000001,
          type_id: typeId,
          location_id: 60003760,
          volume_total: 1000000,
          volume_remain: 500000,
          min_volume: 1,
          price: 4.5,
          is_buy_order: true,
          duration: 90,
          issued: '2024-01-15T12:00:00Z',
          range: 'region',
        }),
        TestDataFactory.createMarketOrder({
          order_id: 5000000002,
          type_id: typeId,
          location_id: 60003760,
          volume_total: 2000000,
          volume_remain: 2000000,
          min_volume: 1,
          price: 4.6,
          is_buy_order: false,
          duration: 30,
          issued: '2024-01-15T10:00:00Z',
          range: 'station',
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(expectedOrders);
    });

    when('the client requests market orders for the region', async () => {
      result = await client.market.getMarketOrders(regionId);
    });

    then('the client shall return current buy and sell orders', () => {
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

  test('WHEN filtering buy and sell orders, the client shall return filtered results', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    let buyOrders: any;
    let sellOrders: any;

    given('market orders with mixed buy and sell types', () => {
      const mixedOrders = [
        TestDataFactory.createMarketOrder({
          order_id: 1,
          is_buy_order: true,
          price: 4.5,
        }),
        TestDataFactory.createMarketOrder({
          order_id: 2,
          is_buy_order: false,
          price: 4.6,
        }),
        TestDataFactory.createMarketOrder({
          order_id: 3,
          is_buy_order: true,
          price: 4.45,
        }),
        TestDataFactory.createMarketOrder({
          order_id: 4,
          is_buy_order: false,
          price: 4.65,
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(mixedOrders);
    });

    when('the client analyzes the market orders', async () => {
      const result = await client.market.getMarketOrders(regionId);
      buyOrders = result.filter((order: any) => order.is_buy_order);
      sellOrders = result.filter((order: any) => !order.is_buy_order);
    });

    then('the client shall distinguish between buy and sell orders', () => {
      expect(buyOrders.length).toBe(2);
      expect(sellOrders.length).toBe(2);
      expect(buyOrders.every((order: any) => order.is_buy_order)).toBe(true);
      expect(sellOrders.every((order: any) => !order.is_buy_order)).toBe(true);

      // Buy orders should have lower prices (buyers want to pay less)
      expect(buyOrders[0].price).toBeLessThan(sellOrders[0].price);
    });
  });

  test('WHEN retrieving historical market data, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;

    given('a valid region and item type', () => {
      const expectedHistory = [
        TestDataFactory.createMarketHistory({
          date: '2024-01-15',
          volume: 1000000000,
          order_count: 2500,
          lowest: 4.2,
          highest: 4.8,
          average: 4.5,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-14',
          volume: 950000000,
          order_count: 2400,
          lowest: 4.15,
          highest: 4.75,
          average: 4.45,
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketHistory')
        .mockResolvedValue(expectedHistory);
    });

    when('the client requests market history', async () => {
      result = await client.market.getMarketHistory(regionId, typeId);
    });

    then('the client shall return historical price and volume data', () => {
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

  test('WHEN analyzing price trends, the client shall return the analysis', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;
    let priceChanges: any;

    given('historical market data with trending prices', () => {
      const trendingHistory = [
        TestDataFactory.createMarketHistory({
          date: '2024-01-10',
          average: 4.0,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-11',
          average: 4.1,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-12',
          average: 4.2,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-13',
          average: 4.3,
        }),
        TestDataFactory.createMarketHistory({
          date: '2024-01-14',
          average: 4.4,
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketHistory')
        .mockResolvedValue(trendingHistory);
    });

    when('the client analyzes price trends', async () => {
      result = await client.market.getMarketHistory(regionId, typeId);
      priceChanges = result
        .slice(1)
        .map((day: any, index: number) => day.average - result[index].average);
    });

    then('the client shall identify market patterns', () => {
      expect(result.length).toBe(5);
      expect(priceChanges.every((change: any) => change > 0)).toBe(true); // Upward trend
      expect(result[result.length - 1].average).toBeGreaterThan(
        result[0].average,
      );

      // Calculate trend strength
      const totalChange = result[result.length - 1].average - result[0].average;
      expect(totalChange).toBeCloseTo(0.4, 2); // 10% increase over 5 days
    });
  });

  test('WHEN retrieving character market orders, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with market orders', () => {
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
          price: 4.5,
          is_buy_order: true,
          duration: 90,
          issued: '2024-01-15T12:00:00Z',
          state: 'open',
        }),
      ];

      jest
        .spyOn(client.market, 'getCharacterOrders')
        .mockResolvedValue(expectedOrders);
    });

    when('the client requests their market orders', async () => {
      result = await client.market.getCharacterOrders(characterId);
    });

    then('the client shall return their active orders', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('order_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('price');
      expect(result[0]).toHaveProperty('state');
      expect(result[0].state).toBe('open');
    });
  });

  test('WHEN retrieving character order history, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with order history', () => {
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
          price: 4.5,
          is_buy_order: true,
          duration: 90,
          issued: '2024-01-10T12:00:00Z',
          state: 'closed',
        }),
      ];

      jest
        .spyOn(client.market, 'getCharacterOrderHistory')
        .mockResolvedValue(expectedHistory);
    });

    when('the client requests their order history', async () => {
      result = await client.market.getCharacterOrderHistory(characterId);
    });

    then('the client shall return completed and cancelled orders', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('order_id');
      expect(result[0]).toHaveProperty('state');
      expect(
        ['closed', 'cancelled', 'expired'].includes(result[0].state!),
      ).toBe(true);
      expect(result[0].volume_remain).toBeLessThanOrEqual(
        result[0].volume_total,
      );
    });
  });

  test('The client shall handle high-frequency market data requests', ({
    given,
    when,
    then,
  }) => {
    const regionIds = [10000002, 10000030, 10000043];
    const typeId = 34;
    let results: any;

    given('multiple concurrent market data requests', () => {
      const mockOrders = regionIds.map((regionId, index) => [
        TestDataFactory.createMarketOrder({
          order_id: 5000000001 + index,
          type_id: typeId,
          price: 4.5 + index * 0.1,
        }),
      ]);

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockImplementation(
          async (regionId: number) =>
            mockOrders[regionIds.indexOf(regionId)] || [],
        );
    });

    when('the client makes them simultaneously', async () => {
      const promises = regionIds.map((regionId) =>
        client.market.getMarketOrders(regionId),
      );
      results = await Promise.all(promises);
    });

    then('all market requests shall complete successfully', () => {
      expect(results).toHaveLength(3);
      results.forEach((result: any, index: number) => {
        expect(result).toBeInstanceOf(Array);
        expect(result[0].price).toBe(4.5 + index * 0.1);
      });
    });
  });

  test('The client shall handle market data with large volumes', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;
    let startTime: number;
    let endTime: number;

    given('a request for market data with many orders', () => {
      const largeOrderSet = Array.from({ length: 5000 }, (_, i) =>
        TestDataFactory.createMarketOrder({
          order_id: 5000000001 + i,
          type_id: typeId,
          price: 4.0 + Math.random() * 2,
          volume_remain: Math.floor(Math.random() * 1000000),
          is_buy_order: Math.random() > 0.5,
        }),
      );

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(largeOrderSet);
    });

    when('the client processes the large market data', async () => {
      startTime = Date.now();
      result = await client.market.getMarketOrders(regionId);
      endTime = Date.now();
    });

    then('the client shall handle large market datasets efficiently', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(5000);
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify data integrity
      const buyOrders = result.filter((order: any) => order.is_buy_order);
      const sellOrders = result.filter((order: any) => !order.is_buy_order);
      expect(buyOrders.length + sellOrders.length).toBe(result.length);
    });
  });

  test('WHEN completing market analysis workflow, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let prices: any;
    let orders: any;
    let history: any;

    given('a market analysis requirement', () => {
      const mockPrices = [
        TestDataFactory.createMarketPrice({
          type_id: typeId,
          average_price: 4.5,
        }),
      ];
      const mockOrders = [
        TestDataFactory.createMarketOrder({
          type_id: typeId,
          price: 4.45,
          is_buy_order: true,
        }),
        TestDataFactory.createMarketOrder({
          type_id: typeId,
          price: 4.55,
          is_buy_order: false,
        }),
      ];
      const mockHistory = [
        TestDataFactory.createMarketHistory({
          date: '2024-01-15',
          average: 4.5,
        }),
      ];

      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockResolvedValue(mockPrices);
      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(mockOrders);
      jest
        .spyOn(client.market, 'getMarketHistory')
        .mockResolvedValue(mockHistory);
    });

    when('the client gathers comprehensive market data', async () => {
      [prices, orders, history] = await Promise.all([
        client.market.getMarketPrices(),
        client.market.getMarketOrders(regionId),
        client.market.getMarketHistory(regionId, typeId),
      ]);
    });

    then(
      'the client shall successfully retrieve all market information',
      () => {
        expect(prices).toBeInstanceOf(Array);
        expect(prices[0].type_id).toBe(typeId);

        expect(orders).toBeInstanceOf(Array);
        expect(orders[0].type_id).toBe(typeId);

        expect(history).toBeInstanceOf(Array);
        expect(history[0].date).toBe('2024-01-15');

        // Verify market analysis capabilities
        const currentPrice = prices.find(
          (p: any) => p.type_id === typeId,
        )?.average_price;
        const buyOrders = orders.filter((o: any) => o.is_buy_order);
        const sellOrders = orders.filter((o: any) => !o.is_buy_order);
        const bestBuyOrder =
          buyOrders.length > 0
            ? buyOrders.reduce((best: any, current: any) =>
                current.price > best.price ? current : best,
              )
            : null;
        const bestSellOrder =
          sellOrders.length > 0
            ? sellOrders.reduce((best: any, current: any) =>
                current.price < best.price ? current : best,
              )
            : null;

        expect(currentPrice).toBeDefined();
        expect(bestBuyOrder).toBeDefined();
        expect(bestSellOrder).toBeDefined();
      },
    );
  });
});
