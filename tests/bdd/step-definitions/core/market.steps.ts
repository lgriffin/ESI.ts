import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0023-market.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Price list returns average and adjusted prices per type', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the market system is operational', () => {
      queueResponse({
        match: '/markets/prices/',
        body: [
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
        ],
      });
    });

    when('the client requests current market prices', async () => {
      result = await client.market.getMarketPrices();
    });

    then('the client shall return price data for all tradeable items', () => {
      expect(lastRequest().method).toBe('GET');
      expect(result).toEqual([
        { type_id: 34, average_price: 5000000.0, adjusted_price: 5100000.0 },
        { type_id: 35, average_price: 15000000.0, adjusted_price: 15200000.0 },
      ]);
    });
  });

  test('Price request during a market data outage is rejected with 503', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('market data is temporarily unavailable', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Market data unavailable', {
        match: '/markets/prices/',
        times: RETRYABLE_ATTEMPTS,
      });
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
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('Region order book returns buy and sell orders for one type', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;

    given('a valid region ID', () => {
      queueResponse({
        match: `/markets/${regionId}/orders/`,
        body: [
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
        ],
      });
    });

    when('the client requests market orders for the region', async () => {
      result = await client.market.getMarketOrders(regionId);
    });

    then('the client shall return current buy and sell orders', () => {
      expect(result).toHaveLength(2);
      expect(result.map((o: any) => o.order_id)).toEqual([
        5000000001, 5000000002,
      ]);
      for (const order of result) {
        expect(order.type_id).toBe(typeId);
        expect(typeof order.price).toBe('number');
        expect(typeof order.is_buy_order).toBe('boolean');
      }
      expect(result.map((o: any) => o.is_buy_order)).toEqual([true, false]);
    });
  });

  test('Mixed order book splits into bid and ask sides by is_buy_order', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    let buyOrders: any;
    let sellOrders: any;

    given('market orders with mixed buy and sell types', () => {
      queueResponse({
        match: `/markets/${regionId}/orders/`,
        body: [
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
        ],
      });
    });

    when('the client analyzes the market orders', async () => {
      const result = await client.market.getMarketOrders(regionId);
      buyOrders = result.filter((order: any) => order.is_buy_order);
      sellOrders = result.filter((order: any) => !order.is_buy_order);
    });

    then('the client shall distinguish between buy and sell orders', () => {
      expect(buyOrders.map((o: any) => o.order_id)).toEqual([1, 3]);
      expect(sellOrders.map((o: any) => o.order_id)).toEqual([2, 4]);
    });
  });

  test('Two days of history return traded volume and price bounds', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
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
    let result: any;

    given('a valid region and item type', () => {
      queueResponse({
        match: `/markets/${regionId}/history/`,
        body: expectedHistory,
      });
    });

    when('the client requests market history', async () => {
      result = await client.market.getMarketHistory(regionId, typeId);
    });

    then('the client shall return historical price and volume data', () => {
      expect(lastRequest().url.searchParams.get('type_id')).toBe(
        String(typeId),
      );
      expect(result).toEqual(expectedHistory);
    });
  });

  test('Five consecutive daily averages expose a rising price series', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;
    let priceChanges: any;

    given('historical market data with trending prices', () => {
      queueResponse({
        match: `/markets/${regionId}/history/`,
        body: ['10', '11', '12', '13', '14'].map((day, i) =>
          TestDataFactory.createMarketHistory({
            date: `2024-01-${day}`,
            average: 4.0 + i * 0.1,
          }),
        ),
      });
    });

    when('the client analyzes price trends', async () => {
      result = await client.market.getMarketHistory(regionId, typeId);
      priceChanges = result
        .slice(1)
        .map((day: any, index: number) => day.average - result[index].average);
    });

    then('the client shall identify market patterns', () => {
      expect(result.map((d: any) => d.date)).toEqual([
        '2024-01-10',
        '2024-01-11',
        '2024-01-12',
        '2024-01-13',
        '2024-01-14',
      ]);
      expect(priceChanges.every((change: number) => change > 0)).toBe(true);
      expect(result[4].average - result[0].average).toBeCloseTo(0.4, 2);
    });
  });

  test('Character open orders carry region and corporation attribution', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with market orders', () => {
      queueResponse({
        match: `/characters/${characterId}/orders/`,
        body: [
          TestDataFactory.createCharacterMarketOrder({
            order_id: 5000000001,
            type_id: 34,
            region_id: 10000002,
            price: 4.5,
            is_corporation: true,
          }),
        ],
      });
    });

    when('the client requests their market orders', async () => {
      result = await client.market.getCharacterOrders(characterId);
    });

    then('the client shall return their active orders', () => {
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        order_id: 5000000001,
        type_id: 34,
        price: 4.5,
        region_id: 10000002,
        is_corporation: true,
      });
    });
  });

  test('Closed order reports a terminal state and its filled volume', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with order history', () => {
      queueResponse({
        match: `/characters/${characterId}/orders/history/`,
        body: [
          TestDataFactory.createCharacterOrderHistory({
            order_id: 5000000001,
            volume_total: 1000000,
            volume_remain: 250000,
            state: 'expired',
          }),
        ],
      });
    });

    when('the client requests their order history', async () => {
      result = await client.market.getCharacterOrderHistory(characterId);
    });

    then('the client shall return completed and cancelled orders', () => {
      expect(result).toHaveLength(1);
      expect(result[0].order_id).toBe(5000000001);
      expect(['cancelled', 'expired']).toContain(result[0].state);
      expect(result[0].volume_remain).toBeLessThanOrEqual(
        result[0].volume_total,
      );
    });
  });

  test('Three region order books requested in parallel each resolve with their own orders', ({
    given,
    when,
    then,
  }) => {
    const regionIds = [10000002, 10000030, 10000043];
    const typeId = 34;
    let results: any;

    given('multiple concurrent market data requests', () => {
      // Queued in reverse so a client that paired responses to requests by
      // arrival order, rather than by URL, would hand back the wrong book.
      [...regionIds].reverse().forEach((regionId) => {
        const index = regionIds.indexOf(regionId);
        queueResponse({
          match: `/markets/${regionId}/orders/`,
          delayMs: (regionIds.length - index) * 5,
          body: [
            TestDataFactory.createMarketOrder({
              order_id: 5000000001 + index,
              type_id: typeId,
              price: 4.5 + index * 0.1,
            }),
          ],
        });
      });
    });

    when('the client makes them simultaneously', async () => {
      results = await Promise.all(
        regionIds.map((regionId) => client.market.getMarketOrders(regionId)),
      );
    });

    then('all market requests shall complete successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(results.map((r: any) => r[0].order_id)).toEqual([
        5000000001, 5000000002, 5000000003,
      ]);
    });
  });

  test('Order book of 5000 entries is returned intact inside the time budget', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    const typeId = 34;
    let result: any;
    let elapsedMs: number;

    given('a request for market data with many orders', () => {
      queueResponse({
        match: `/markets/${regionId}/orders/`,
        body: Array.from({ length: 5000 }, (_, i) =>
          TestDataFactory.createMarketOrder({
            order_id: 5000000001 + i,
            type_id: typeId,
            price: 4.0 + (i % 200) / 100,
            is_buy_order: i % 2 === 0,
          }),
        ),
      });
    });

    when('the client processes the large market data', async () => {
      // The interval covers the pipeline: body parsing, Zod validation, caching.
      const start = performance.now();
      result = await client.market.getMarketOrders(regionId);
      elapsedMs = performance.now() - start;
    });

    then('the client shall handle large market datasets efficiently', () => {
      expect(result).toHaveLength(5000);
      expect(result[0].order_id).toBe(5000000001);
      expect(result[4999].order_id).toBe(5000005000);
      expect(elapsedMs).toBeLessThan(1000);
    });
  });

  test('Price, order book, and history lookups combine into one analysis pass', ({
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
      queueResponse({
        match: '/markets/prices/',
        body: [
          TestDataFactory.createMarketPrice({
            type_id: typeId,
            average_price: 4.5,
          }),
        ],
      });
      queueResponse({
        match: `/markets/${regionId}/orders/`,
        body: [
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
        ],
      });
      queueResponse({
        match: `/markets/${regionId}/history/`,
        body: [
          TestDataFactory.createMarketHistory({
            date: '2024-01-15',
            average: 4.5,
          }),
        ],
      });
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
        expect(prices).toEqual([
          expect.objectContaining({ type_id: typeId, average_price: 4.5 }),
        ]);
        expect(orders.map((o: any) => o.price)).toEqual([4.45, 4.55]);
        expect(history).toEqual([
          expect.objectContaining({ date: '2024-01-15', average: 4.5 }),
        ]);
      },
    );
  });
});
