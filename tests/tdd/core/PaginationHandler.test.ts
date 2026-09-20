import { PaginationHandler } from '../../../src/core/pagination/PaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError } from '../../../src/core/util/error';
import { logCalls, spyLogger, SpyLogger } from '../helpers/spyLogger';

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
      client.setRetryConfig({ maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 });
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockRejectedValueOnce(new EsiError(502, 'Bad Gateway'))
        .mockResolvedValueOnce([{ id: 2 }]);

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

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pageFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after maxRetries consecutive failures', async () => {
      client.setRetryConfig({ maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 });
      const firstPageData = [{ id: 1 }];
      pageFetch.mockRejectedValue(new EsiError(502, 'Bad Gateway'));

      await expect(
        PaginationHandler.fetchRemainingPages(
          client,
          'alliances',
          'GET',
          false,
          firstPageData,
          5,
          undefined,
          {},
          pageFetch,
        ),
      ).rejects.toThrow('Bad Gateway');
    });

    it('should retry failed pages and continue on success', async () => {
      client.setRetryConfig({ maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 });
      const firstPageData = [{ id: 1 }];
      pageFetch
        .mockRejectedValueOnce(new EsiError(502, 'Bad Gateway'))
        .mockResolvedValueOnce([{ id: 2 }])
        .mockRejectedValueOnce(new EsiError(502, 'Bad Gateway'))
        .mockResolvedValueOnce([{ id: 3 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        3,
        undefined,
        {},
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

    it('should use IRetryStrategy instead of custom retry logic', async () => {
      // With no retry config, default maxRetries is 0 — no retries
      const firstPageData = [{ id: 1 }];
      pageFetch.mockRejectedValue(new EsiError(502, 'Bad Gateway'));

      // Should fail immediately (no retries) with default strategy
      await expect(
        PaginationHandler.fetchRemainingPages(
          client,
          'alliances',
          'GET',
          false,
          firstPageData,
          2,
          undefined,
          {},
          pageFetch,
        ),
      ).rejects.toThrow('Bad Gateway');

      // With default maxRetries=0, pageFetch called exactly once
      expect(pageFetch).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry strategy when set on client', async () => {
      const executeMock = jest.fn();
      const customStrategy = {
        execute: async <T>(operation: () => Promise<T>): Promise<T> => {
          executeMock();
          return operation();
        },
      };
      client.setRetryStrategy(customStrategy);
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      await PaginationHandler.fetchRemainingPages(
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

      expect(executeMock).toHaveBeenCalled();
    });

    it('should pass refreshToken when client has token provider', async () => {
      client.setAccessToken('test-token');
      client.setTokenProvider(async () => 'refreshed-token');
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        true,
        firstPageData,
        2,
        undefined,
        {},
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('exact logging', () => {
    let logger: SpyLogger;
    const fetchRemaining = (totalPages: number) =>
      PaginationHandler.fetchRemainingPages(
        client,
        'x',
        'GET',
        false,
        [{ id: 1 }],
        totalPages,
        undefined,
        {},
        pageFetch,
      );

    beforeEach(() => {
      logger = spyLogger();
      client.setLogger(logger);
      client.setRetryConfig({ maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1 });
    });

    it('logs nothing and fetches nothing for a single page', async () => {
      expect(await fetchRemaining(1)).toEqual([{ id: 1 }]);

      expect(pageFetch).not.toHaveBeenCalled();
      expect(logCalls(logger)).toEqual([]);
    });

    it('logs the plan, each page and the total, with their context', async () => {
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      expect(await fetchRemaining(2)).toEqual([{ id: 1 }, { id: 2 }]);

      expect(logCalls(logger)).toEqual([
        [
          'info',
          'Fetching pages 2-2 for x...',
          { method: 'GET', totalPages: 2 },
        ],
        ['info', 'Fetching page 2 via pipeline: x?page=2', { page: 2 }],
        ['info', 'Fetched page 2/2 (1 items)', { page: 2, items: 1 }],
        [
          'info',
          'Pagination complete. Fetched 2 total items from up to 2 pages.',
          { totalItems: 2 },
        ],
      ]);
    });

    it('warns with the page number when a page comes back empty', async () => {
      pageFetch.mockResolvedValueOnce([]);

      await fetchRemaining(3);

      expect(logger.warn.mock.calls).toEqual([
        ['Page 2 is empty. Stopping pagination.', { page: 2 }],
      ]);
    });

    it('logs the failing page before rethrowing', async () => {
      pageFetch.mockRejectedValueOnce(new Error('boom'));

      await expect(fetchRemaining(2)).rejects.toThrow('boom');

      expect(logger.error.mock.calls).toEqual([
        ['Failed to fetch page 2: boom', { page: 2 }],
      ]);
    });
  });
});
