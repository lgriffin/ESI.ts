/**
 * What ESI's market endpoints send back in 0023-market.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

export const THE_FORGE = 10000002;
export const DOMAIN = 10000043;
export const HEIMATAR = 10000030;
export const TRITANIUM = 34;
export const PYERITE = 35;
export const TRADER_CHARACTER_ID = 1689391488;

export const marketPaths = {
  prices: '/markets/prices/',
  orders: (regionId: number) => `/markets/${regionId}/orders/`,
  history: (regionId: number) => `/markets/${regionId}/history/`,
  characterOrders: (characterId: number) =>
    `/characters/${characterId}/orders/`,
  characterOrderHistory: (characterId: number) =>
    `/characters/${characterId}/orders/history/`,
};

export const marketFixtures = {
  priceList: () => [
    TestDataFactory.createMarketPrice({
      type_id: TRITANIUM,
      average_price: 5000000.0,
      adjusted_price: 5100000.0,
    }),
    TestDataFactory.createMarketPrice({
      type_id: PYERITE,
      average_price: 15000000.0,
      adjusted_price: 15200000.0,
    }),
  ],

  /** One buy and one sell order for Tritanium in The Forge. */
  regionOrderBook: () => [
    TestDataFactory.createMarketOrder({
      order_id: 5000000001,
      type_id: TRITANIUM,
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
      type_id: TRITANIUM,
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

  /** Buy orders 1 and 3, sell orders 2 and 4, interleaved. */
  mixedOrderBook: () =>
    [
      { order_id: 1, is_buy_order: true, price: 4.5 },
      { order_id: 2, is_buy_order: false, price: 4.6 },
      { order_id: 3, is_buy_order: true, price: 4.45 },
      { order_id: 4, is_buy_order: false, price: 4.65 },
    ].map((order) => TestDataFactory.createMarketOrder(order)),

  twoDayHistory: () => [
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
  ],

  /** Five days, 10 to 14 January, each average 0.1 above the day before. */
  risingHistory: () =>
    ['10', '11', '12', '13', '14'].map((day, i) =>
      TestDataFactory.createMarketHistory({
        date: `2024-01-${day}`,
        average: 4.0 + i * 0.1,
      }),
    ),

  characterOpenOrders: () => [
    TestDataFactory.createCharacterMarketOrder({
      order_id: 5000000001,
      type_id: TRITANIUM,
      region_id: THE_FORGE,
      price: 4.5,
      is_corporation: true,
    }),
  ],

  characterOrderHistory: () => [
    TestDataFactory.createCharacterOrderHistory({
      order_id: 5000000001,
      volume_total: 1000000,
      volume_remain: 250000,
      state: 'expired',
    }),
  ],

  /** One order per region, its order_id offset by the region's position. */
  singleOrderFor: (position: number) => [
    TestDataFactory.createMarketOrder({
      order_id: 5000000001 + position,
      type_id: TRITANIUM,
      price: 4.5 + position * 0.1,
    }),
  ],

  largeOrderBook: (size: number) =>
    Array.from({ length: size }, (_, i) =>
      TestDataFactory.createMarketOrder({
        order_id: 5000000001 + i,
        type_id: TRITANIUM,
        price: 4.0 + (i % 200) / 100,
        is_buy_order: i % 2 === 0,
      }),
    ),

  analysisPrice: () => [
    TestDataFactory.createMarketPrice({
      type_id: TRITANIUM,
      average_price: 4.5,
    }),
  ],

  analysisOrderBook: () => [
    TestDataFactory.createMarketOrder({
      type_id: TRITANIUM,
      price: 4.45,
      is_buy_order: true,
    }),
    TestDataFactory.createMarketOrder({
      type_id: TRITANIUM,
      price: 4.55,
      is_buy_order: false,
    }),
  ],

  analysisHistory: () => [
    TestDataFactory.createMarketHistory({ date: '2024-01-15', average: 4.5 }),
  ],
};

/** Regions fanned out over concurrently, in request order. */
export const CONCURRENT_REGIONS = [THE_FORGE, HEIMATAR, DOMAIN];

export const LARGE_ORDER_BOOK_SIZE = 5000;
