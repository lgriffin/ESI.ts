import { ApiClient } from '../../../src/core/ApiClient';
import { MarketClient } from '../../../src/clients/MarketClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { PageResult } from '../../../src/core/pagination/AsyncPaginationIterator';
import { MarketOrder } from '../../../src/types/api-responses';

jest.mock('../../../src/core/ApiRequestHandler', () => {
  const original = jest.requireActual('../../../src/core/ApiRequestHandler');
  return {
    ...original,
    handleRequest: jest.fn(),
  };
});

import { handleRequest } from '../../../src/core/ApiRequestHandler';
const mockHandleRequest = handleRequest as jest.MockedFunction<
  typeof handleRequest
>;

function mockOrder(overrides: Partial<MarketOrder> = {}): MarketOrder {
  return {
    order_id: 1,
    type_id: 34,
    location_id: 60003760,
    volume_total: 1000,
    volume_remain: 500,
    min_volume: 1,
    price: 5.5,
    is_buy_order: false,
    duration: 90,
    issued: '2024-01-01T00:00:00Z',
    range: 'region',
    ...overrides,
  };
}

describe('MarketClient streaming', () => {
  let apiClient: ApiClient;
  let marketClient: MarketClient;

  beforeEach(() => {
    mockHandleRequest.mockReset();
    apiClient = new ApiClient('test', 'https://esi.evetech.net');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient.setRateLimiter(rateLimiter);
    marketClient = new MarketClient(apiClient);
  });

  describe('streamMarketOrders', () => {
    it('should build correct URL with order_type=all', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [mockOrder()],
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of marketClient.streamMarketOrders(10000002)) {
        // consume
      }

      expect(mockHandleRequest).toHaveBeenCalledWith(
        apiClient,
        'markets/10000002/orders/?order_type=all',
        'GET',
        undefined,
        false,
      );
    });

    it('should stream multiple pages of market orders', async () => {
      const page1 = [mockOrder({ order_id: 1 }), mockOrder({ order_id: 2 })];
      const page2 = [mockOrder({ order_id: 3 })];

      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '2' },
          body: page1,
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '2' },
          body: page2,
        });

      const pages: PageResult<MarketOrder>[] = [];
      for await (const page of marketClient.streamMarketOrders(10000002)) {
        pages.push(page);
      }

      expect(pages).toHaveLength(2);
      expect(pages[0].data).toHaveLength(2);
      expect(pages[0].data[0].order_id).toBe(1);
      expect(pages[1].data).toHaveLength(1);
      expect(pages[1].data[0].order_id).toBe(3);
    });

    it('should allow early termination', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '100' },
          body: [mockOrder()],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '100' },
          body: [mockOrder()],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '100' },
          body: [mockOrder()],
        });

      let pagesConsumed = 0;
      for await (const page of marketClient.streamMarketOrders(10000002)) {
        pagesConsumed++;
        if (page.page >= 3) break;
      }

      expect(pagesConsumed).toBe(3);
      expect(mockHandleRequest).toHaveBeenCalledTimes(3);
    });

    it('should support aggregation during streaming', async () => {
      const buyOrder = mockOrder({ is_buy_order: true, price: 10 });
      const sellOrder = mockOrder({ is_buy_order: false, price: 20 });

      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [buyOrder, sellOrder],
      });

      let buyCount = 0;
      let sellCount = 0;
      for await (const page of marketClient.streamMarketOrders(10000002)) {
        for (const order of page.data) {
          if (order.is_buy_order) buyCount++;
          else sellCount++;
        }
      }

      expect(buyCount).toBe(1);
      expect(sellCount).toBe(1);
    });
  });

  describe('streamMarketTypes', () => {
    it('should build correct URL', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [34, 35, 36],
      });

      const pages: PageResult<number>[] = [];
      for await (const page of marketClient.streamMarketTypes(10000002)) {
        pages.push(page);
      }

      expect(mockHandleRequest).toHaveBeenCalledWith(
        apiClient,
        'markets/10000002/types/',
        'GET',
        undefined,
        false,
      );
      expect(pages[0].data).toEqual([34, 35, 36]);
    });
  });

  describe('streamMarketOrdersInStructure', () => {
    it('should build correct URL with structureId', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [mockOrder()],
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of marketClient.streamMarketOrdersInStructure(
        1234567890,
      )) {
        // consume
      }

      expect(mockHandleRequest).toHaveBeenCalledWith(
        apiClient,
        'markets/structures/1234567890/',
        'GET',
        undefined,
        false,
      );
    });
  });
});
