import { PaginationHandler } from '../../../src/core/pagination/PaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError, EsiPaginationError } from '../../../src/core/util/error';
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

    it('DES-08: rejects with empty-page when a page after the first is empty', async () => {
      const firstPageData = [{ id: 1 }];
      pageFetch.mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([]);

      const error = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        firstPageData,
        4,
        undefined,
        { where: 'https://esi.evetech.net/alliances' },
        pageFetch,
      ).then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(pageFetch).toHaveBeenCalledTimes(2);
      const incomplete = error as EsiPaginationError;
      expect(incomplete).toBeInstanceOf(EsiPaginationError);
      expect(incomplete.reason).toBe('empty-page');
      expect(incomplete.url).toBe('https://esi.evetech.net/alliances');
      expect(incomplete.endpoint).toBe('alliances');
      expect(incomplete.reportedPages).toBe(4);
      expect(incomplete.fetchedPages).toBe(3);
      expect(incomplete.partial).toEqual([{ id: 1 }, { id: 2 }]);
      expect(incomplete.itemCount).toBe(2);
    });

    it('DES-08: rejects with empty-page when the last reported page is empty', async () => {
      pageFetch.mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([]);

      await expect(
        PaginationHandler.fetchRemainingPages(
          client,
          'alliances',
          'GET',
          false,
          [{ id: 1 }],
          3,
          undefined,
          {},
          pageFetch,
        ),
      ).rejects.toMatchObject({ reason: 'empty-page', fetchedPages: 3 });
    });

    it('DES-08: rejects with page-cap without requesting a page when totalPages exceeds maxPages', async () => {
      const error = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        [{ id: 1 }],
        5,
        undefined,
        { maxPages: 2 },
        pageFetch,
      ).then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(pageFetch).not.toHaveBeenCalled();
      expect(error).toMatchObject({
        reason: 'page-cap',
        reportedPages: 5,
        fetchedPages: 1,
        partial: [{ id: 1 }],
      });
    });

    it('DES-08: never raises the limit above MAX_PAGES', async () => {
      await expect(
        PaginationHandler.fetchRemainingPages(
          client,
          'alliances',
          'GET',
          false,
          [{ id: 1 }],
          1001,
          undefined,
          { maxPages: 5000 },
          pageFetch,
        ),
      ).rejects.toMatchObject({ reason: 'page-cap', reportedPages: 1001 });
      expect(pageFetch).not.toHaveBeenCalled();
    });

    it('DES-08: resolves with every page when totalPages equals maxPages', async () => {
      pageFetch.mockResolvedValueOnce([{ id: 2 }]);

      const result = await PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        [{ id: 1 }],
        2,
        undefined,
        { maxPages: 2 },
        pageFetch,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
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
          'Pagination complete. Fetched 2 total items from 2 pages.',
          { totalItems: 2 },
        ],
      ]);
    });

    it('DES-08: rejects on an empty page without logging, leaving the report to the caller', async () => {
      pageFetch.mockResolvedValueOnce([]);

      await expect(fetchRemaining(3)).rejects.toThrow(
        'Pagination incomplete for x: page 2 of 3 was empty, so the collection changed during the walk',
      );

      expect(logger.warn.mock.calls).toEqual([]);
      expect(logger.error.mock.calls).toEqual([]);
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
