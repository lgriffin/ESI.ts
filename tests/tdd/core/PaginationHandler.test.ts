import { PaginationHandler } from '../../../src/core/pagination/PaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

describe('PaginationHandler', () => {
  let client: ApiClient;
  let pageFetch: jest.Mock;

  beforeEach(() => {
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
    client.setRateLimiter(rateLimiter);
    pageFetch = jest.fn();
  });

  describe('fetchRemainingPages', () => {
    it('should return first page data when totalPages is 1', async () => {
      const firstPageData = [{ id: 1 }, { id: 2 }];

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        1,
        undefined,
        {},
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pageFetch).not.toHaveBeenCalled();
    });

    it('should fetch page 2 and combine with page 1 data', async () => {
      const firstPageData = [{ id: 1 }, { id: 2 }];
      pageFetch.mockResolvedValueOnce([{ id: 3 }, { id: 4 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        2,
        undefined,
        {},
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(pageFetch).toHaveBeenCalledTimes(1);
      expect(pageFetch).toHaveBeenCalledWith('alliances?page=2');
    });

    it('should fetch multiple remaining pages', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockResolvedValueOnce([{ id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }])
        .mockResolvedValueOnce([{ id: 4 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        4,
        undefined,
        {},
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(pageFetch).toHaveBeenCalledTimes(3);
    });

    it('should preserve query params when paginating', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockResolvedValueOnce([{ id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      await PaginationHandler.fetchRemainingPages(
        client,
        'markets/10000002/orders?order_type=all',
        'GET',
        false,
        firstPageData,
        3,
        undefined,
        {},
        pageFetch,
      );

      expect(pageFetch).toHaveBeenCalledWith(
        'markets/10000002/orders?order_type=all&page=2',
      );
      expect(pageFetch).toHaveBeenCalledWith(
        'markets/10000002/orders?order_type=all&page=3',
      );
    });

    it('should stop on empty page when stopOnEmptyPage is true', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        4,
        undefined,
        { stopOnEmptyPage: true },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pageFetch).toHaveBeenCalledTimes(2);
    });

    it('should not stop on empty page when stopOnEmptyPage is false', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 3 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        3,
        undefined,
        { stopOnEmptyPage: false },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 3 }]);
      expect(pageFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect maxPages option', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        5,
        undefined,
        { maxPages: 2 },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pageFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry failed page fetches', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce([{ id: 2 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        2,
        undefined,
        { maxRetries: 3, retryDelayMs: 1 },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pageFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after maxRetries consecutive failures', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch.mockRejectedValue(new Error('HTTP 500: Internal Server Error'));

      await expect(
        PaginationHandler.fetchRemainingPages(
          client,
          'alliances',
          'GET',
          false,
          firstPageData,
          5,
          undefined,
          { maxRetries: 3, retryDelayMs: 1 },
          pageFetch,
        ),
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should retry failed pages and continue on success', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce([{ id: 2 }])
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce([{ id: 3 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        3,
        undefined,
        { maxRetries: 3, retryDelayMs: 1 },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should send body on POST paginated requests', async () => {
      const firstPageData = [{ id: 1 }];
      const body = { ids: [1, 2, 3] };
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      await PaginationHandler.fetchRemainingPages(
        client,
        'universe/names',
        'POST',
        false,
        firstPageData,
        2,
        body,
        {},
        pageFetch,
      );

      expect(pageFetch).toHaveBeenCalledWith('universe/names?page=2');
    });
  });
});
