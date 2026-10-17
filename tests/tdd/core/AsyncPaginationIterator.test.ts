import {
  fetchAllPages,
  fetchPages,
  PageResult,
} from '../../../src/core/pagination/AsyncPaginationIterator';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  EsiPaginationError,
  EsiValidationError,
} from '../../../src/core/util/error';
import { z } from 'zod';
import { logCalls, spyLogger } from '../helpers/spyLogger';

import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('../../../src/core/ApiRequestHandler', () => {
  const original = jest.requireActual('../../../src/core/ApiRequestHandler');
  return {
    ...original,
    handleSinglePageRequest: jest.fn(),
  };
});

import { handleSinglePageRequest } from '../../../src/core/ApiRequestHandler';
const mockHandleRequest = handleSinglePageRequest as jest.MockedFunction<
  typeof handleSinglePageRequest
>;

describe('AsyncPaginationIterator', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    mockHandleRequest.mockReset();
    client = new ApiClient('test', 'https://esi.evetech.net/latest');
    const limiter = new RateLimiter();
    limiter.setTestMode(true);
    client.setRateLimiter(limiter);
  });

  describe('fetchPages', () => {
    it('should yield a single page when x-pages is 1', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [{ id: 1 }, { id: 2 }],
      });

      const pages: PageResult<{ id: number }>[] = [];
      for await (const page of fetchPages<{ id: number }>(
        client,
        'alliances',
        'GET',
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(pages[0].data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(pages[0].page).toBe(1);
      expect(pages[0].totalPages).toBe(1);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should yield a single page when x-pages header is absent', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: {},
        body: [{ id: 1 }],
      });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(pages[0].totalPages).toBe(1);
    });

    it('should yield multiple pages', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 2 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 3 }],
        });

      const pages: PageResult<{ id: number }>[] = [];
      for await (const page of fetchPages<{ id: number }>(
        client,
        'alliances',
        'GET',
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(3);
      expect(pages[0].page).toBe(1);
      expect(pages[1].page).toBe(2);
      expect(pages[2].page).toBe(3);
      expect(pages[0].data).toEqual([{ id: 1 }]);
      expect(pages[1].data).toEqual([{ id: 2 }]);
      expect(pages[2].data).toEqual([{ id: 3 }]);
    });

    it('DES-08: by default a stream empty-page warning reports the count page 1 reported, not the capped one', async () => {
      const logger = spyLogger();
      client.setLogger(logger);
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '1001' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({ headers: { 'x-pages': '1001' }, body: [] });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(logger.warn.mock.calls).toEqual([
        [
          expect.stringContaining('page 2 of 1001 was empty'),
          expect.objectContaining({
            reason: 'empty-page',
            reportedPages: 1001,
          }),
        ],
      ]);
    });

    it('DES-08: by default stops at an empty page after the first, after yielding the pages before it', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [],
        });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('DES-08: by default walks a count above 1000 as far as page 1000 and warns', async () => {
      const logger = spyLogger();
      client.setLogger(logger);
      mockHandleRequest.mockImplementation((_c, endpoint: string) =>
        Promise.resolve({
          headers: { 'x-pages': '1001' },
          body: [Number(/page=(\d+)/.exec(endpoint)?.[1] ?? '1')],
        }),
      );

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1000);
      expect(pages[0]!.totalPages).toBe(1000);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1000);
      expect(logger.warn.mock.calls).toEqual([
        [
          expect.stringContaining("Set incompletePages: 'throw'"),
          {
            page: 1000,
            reason: 'page-cap',
            endpoint: 'alliances',
            reportedPages: 1001,
            fetchedPages: 1000,
            itemCount: 1000,
          },
        ],
      ]);
    });

    it('DES-08: with incompletePages throw, rejects with empty-page when a page after the first is empty, counting the items yielded', async () => {
      client.setIncompletePages('throw');
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [],
        });

      const pages: PageResult[] = [];
      const error = await (async () => {
        for await (const page of fetchPages(client, 'alliances', 'GET')) {
          pages.push(page);
        }
      })().then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(pages).toHaveLength(1);
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
      expect(error).toBeInstanceOf(EsiPaginationError);
      const incomplete = error as EsiPaginationError;
      expect(incomplete.reason).toBe('empty-page');
      expect(incomplete.endpoint).toBe('alliances');
      expect(incomplete.url).toBe('https://esi.evetech.net/latest/alliances');
      expect(incomplete.reportedPages).toBe(3);
      expect(incomplete.fetchedPages).toBe(2);
      expect(incomplete.partial).toEqual([]);
      expect(incomplete.itemCount).toBe(1);
    });

    it('DES-08: with incompletePages throw, rejects with page-cap before yielding when page 1 reports more than 1000 pages', async () => {
      client.setIncompletePages('throw');
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1001' },
        body: [{ id: 1 }],
      });

      const pages: PageResult[] = [];
      const error = await (async () => {
        for await (const page of fetchPages(client, 'alliances', 'GET')) {
          pages.push(page);
        }
      })().then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(pages).toHaveLength(0);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      const incomplete = error as EsiPaginationError;
      expect(incomplete).toBeInstanceOf(EsiPaginationError);
      expect(incomplete.reason).toBe('page-cap');
      expect(incomplete.reportedPages).toBe(1001);
      expect(incomplete.fetchedPages).toBe(1);
      expect(incomplete.partial).toEqual([{ id: 1 }]);
      expect(incomplete.message).toBe(
        '[PAGINATION_INCOMPLETE] Pagination incomplete for https://esi.evetech.net/latest/alliances: ESI reported 1001 pages, more than the client requests for one call',
      );
    });

    it('DES-08: walks exactly 1000 reported pages', async () => {
      mockHandleRequest.mockImplementation((_c, endpoint: string) =>
        Promise.resolve({
          headers: { 'x-pages': '1000' },
          body: [Number(/page=(\d+)/.exec(endpoint)?.[1] ?? '1')],
        }),
      );

      const items: unknown[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        items.push(...page.data);
      }

      expect(items).toHaveLength(1000);
      expect(items[999]).toBe(1000);
    });

    it('should append page parameter correctly for URLs with existing query params', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '2' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '2' },
          body: [{ id: 2 }],
        });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(
        client,
        'characters/123/assets?datasource=tranquility',
        'GET',
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(2);
      const secondCallEndpoint = mockHandleRequest.mock.calls[1][1];
      expect(secondCallEndpoint).toContain('&page=2');
      expect(secondCallEndpoint).not.toContain('?page=2');
    });

    it('should wrap non-array response in an array', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: { status: 'ok' },
      });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'status', 'GET')) {
        pages.push(page);
      }

      expect(pages[0].data).toEqual([{ status: 'ok' }]);
    });

    it('should allow early break from consumer', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '10' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '10' },
          body: [{ id: 2 }],
        });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'alliances', 'GET')) {
        pages.push(page);
        if (page.page >= 2) break;
      }

      expect(pages).toHaveLength(2);
      expect(mockHandleRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle null/undefined body as empty array', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: null,
      });

      const pages: PageResult[] = [];
      for await (const page of fetchPages(client, 'empty', 'GET')) {
        pages.push(page);
      }

      expect(pages[0].data).toEqual([]);
    });

    it('should pass requiresAuth and body through to handleSinglePageRequest', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [{ id: 1 }],
      });

      const requestBody = { ids: [1, 2, 3] };
      const pages: PageResult[] = [];
      for await (const page of fetchPages(
        client,
        'universe/names',
        'POST',
        true,
        requestBody,
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(mockHandleRequest).toHaveBeenCalledWith(
        client,
        'universe/names',
        'POST',
        requestBody,
        true,
        undefined,
        undefined,
        false,
      );
    });
  });

  describe('fetchAllPages', () => {
    it('should return all items from a single page', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: [{ id: 1 }, { id: 2 }],
      });

      const result = await fetchAllPages<{ id: number }>(
        client,
        'alliances',
        'GET',
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should merge all pages into a single array', async () => {
      mockHandleRequest
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 2 }],
        })
        .mockResolvedValueOnce({
          headers: { 'x-pages': '3' },
          body: [{ id: 3 }],
        });

      const result = await fetchAllPages<{ id: number }>(
        client,
        'alliances',
        'GET',
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(mockHandleRequest).toHaveBeenCalledTimes(3);
    });

    it('DES-08: by default an empty-page warning reports the count page 1 reported, not the capped one', async () => {
      const logger = spyLogger();
      client.setLogger(logger);
      mockHandleRequest.mockImplementation((_c, endpoint: string) => {
        const page = Number(/page=(\d+)/.exec(endpoint)?.[1] ?? '1');
        return Promise.resolve({
          headers: { 'x-pages': '1001' },
          body: page === 2 ? [] : [page],
        });
      });

      const items = await fetchAllPages(client, 'alliances', 'GET');

      expect(items).toHaveLength(999);
      const warnings = logger.warn.mock.calls;
      expect(warnings).toHaveLength(2);
      expect(warnings[0]![0]).toContain('page 2 of 1001 was empty');
      expect(warnings[0]![1]).toMatchObject({
        reason: 'empty-page',
        reportedPages: 1001,
      });
      expect(warnings[1]![1]).toMatchObject({
        reason: 'page-cap',
        reportedPages: 1001,
      });
    });

    it('DES-08: by default collects past an empty page in a wave and warns once', async () => {
      const logger = spyLogger();
      client.setLogger(logger);
      const bodies: Record<string, unknown[]> = {
        '1': [{ id: 1 }],
        '2': [],
        '3': [],
        '4': [{ id: 4 }],
      };
      mockHandleRequest.mockImplementation((_c, endpoint: string) =>
        Promise.resolve({
          headers: { 'x-pages': '4' },
          body: bodies[/page=(\d+)/.exec(endpoint)?.[1] ?? '1'],
        }),
      );

      await expect(fetchAllPages(client, 'alliances', 'GET')).resolves.toEqual([
        { id: 1 },
        { id: 4 },
      ]);
      expect(mockHandleRequest).toHaveBeenCalledTimes(4);
      expect(logger.warn.mock.calls).toEqual([
        [
          expect.stringContaining(
            "page 2 of 4 was empty, so the collection changed during the walk; the result may be incomplete. Set incompletePages: 'throw'",
          ),
          {
            page: 2,
            reason: 'empty-page',
            endpoint: 'alliances',
            reportedPages: 4,
            fetchedPages: 2,
            itemCount: 1,
          },
        ],
      ]);
    });

    it('DES-08: by default resolves with the first 1000 pages of a count above 1000', async () => {
      mockHandleRequest.mockImplementation((_c, endpoint: string) =>
        Promise.resolve({
          headers: { 'x-pages': '100000000' },
          body: [Number(/page=(\d+)/.exec(endpoint)?.[1] ?? '1')],
        }),
      );

      const items = await fetchAllPages(client, 'alliances', 'GET');

      expect(items).toHaveLength(1000);
      expect(items[999]).toBe(1000);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1000);
    });

    it('DES-08: with incompletePages throw, rejects with empty-page and the prefix before it when a page in a wave is empty', async () => {
      client.setIncompletePages('throw');
      const bodies: Record<string, unknown[]> = {
        '1': [{ id: 1 }],
        '2': [{ id: 2 }],
        '3': [],
        '4': [{ id: 4 }],
      };
      mockHandleRequest.mockImplementation((_c, endpoint: string) =>
        Promise.resolve({
          headers: { 'x-pages': '4' },
          body: bodies[/page=(\d+)/.exec(endpoint)?.[1] ?? '1'],
        }),
      );

      const error = await fetchAllPages(client, 'alliances', 'GET').then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(mockHandleRequest).toHaveBeenCalledTimes(4);
      const incomplete = error as EsiPaginationError;
      expect(incomplete).toBeInstanceOf(EsiPaginationError);
      expect(incomplete.reason).toBe('empty-page');
      expect(incomplete.reportedPages).toBe(4);
      expect(incomplete.fetchedPages).toBe(3);
      expect(incomplete.partial).toEqual([{ id: 1 }, { id: 2 }]);
      expect(incomplete.itemCount).toBe(2);
      expect(incomplete.message).toBe(
        '[PAGINATION_INCOMPLETE] Pagination incomplete for https://esi.evetech.net/latest/alliances: page 3 of 4 was empty, so the collection changed during the walk',
      );
    });

    it('DES-08: with incompletePages throw, rejects with page-cap after page 1 when page 1 reports more than 1000 pages', async () => {
      client.setIncompletePages('throw');
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '100000000' },
        body: [{ id: 1 }],
      });

      const error = await fetchAllPages(client, 'alliances', 'GET').then(
        () => undefined,
        (e: unknown) => e,
      );

      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
      const incomplete = error as EsiPaginationError;
      expect(incomplete.reason).toBe('page-cap');
      expect(incomplete.reportedPages).toBe(100000000);
      expect(incomplete.partial).toEqual([{ id: 1 }]);
    });

    it('DES-08: an unreadable X-Pages is one page, not an error', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': 'many' },
        body: [{ id: 1 }],
      });

      await expect(fetchAllPages(client, 'alliances', 'GET')).resolves.toEqual([
        { id: 1 },
      ]);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('should fetch remaining pages concurrently within batch size', async () => {
      const callOrder: number[] = [];
      let inFlight = 0;
      let maxInFlight = 0;
      mockHandleRequest.mockImplementation(async (_c, endpoint: string) => {
        const pageMatch = endpoint.match(/page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
        callOrder.push(page);
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        // Yield so the rest of the batch can start before this page settles.
        await Promise.resolve();
        inFlight--;
        return {
          headers: { 'x-pages': '5' },
          body: [{ id: page }],
        };
      });

      const result = await fetchAllPages<{ id: number }>(
        client,
        'alliances',
        'GET',
        false,
        undefined,
        undefined,
        undefined,
        2,
      );

      expect(result).toHaveLength(5);
      expect(mockHandleRequest).toHaveBeenCalledTimes(5);
      expect(callOrder).toEqual([1, 2, 3, 4, 5]);
      expect(maxInFlight).toBe(2);
    });

    it('should return empty array when body is null', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: { 'x-pages': '1' },
        body: null,
      });

      const result = await fetchAllPages(client, 'empty', 'GET');
      expect(result).toEqual([]);
    });

    it('should handle missing x-pages header as single page', async () => {
      mockHandleRequest.mockResolvedValueOnce({
        headers: {},
        body: [{ id: 1 }],
      });

      const result = await fetchAllPages<{ id: number }>(
        client,
        'alliances',
        'GET',
      );

      expect(result).toEqual([{ id: 1 }]);
      expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('exact requests, logging and validation', () => {
    const pageSchema = z.array(z.looseObject({ id: z.number() }));

    const collect = async <T>(it: AsyncGenerator<PageResult<T>>) => {
      const pages: PageResult<T>[] = [];
      for await (const page of it) pages.push(page);
      return pages;
    };

    it('requests pages 2..N as ?page=N, without auth by default', async () => {
      mockHandleRequest.mockImplementation(async (_c, endpoint) => ({
        headers: { 'x-pages': '3' },
        body: [{ id: endpoint }],
      }));

      await fetchAllPages(client, 'alliances', 'GET');

      expect(
        mockHandleRequest.mock.calls.map((c) => [c[1], c[4]]).sort(),
      ).toEqual([
        ['alliances', false],
        ['alliances?page=2', false],
        ['alliances?page=3', false],
      ]);
    });

    it('fetchPages requests without auth by default', async () => {
      mockHandleRequest.mockResolvedValue({
        headers: { 'x-pages': '1' },
        body: [],
      });

      await collect(fetchPages(client, 'alliances', 'GET'));

      expect(mockHandleRequest).toHaveBeenCalledWith(
        client,
        'alliances',
        'GET',
        undefined,
        false,
        undefined,
        undefined,
        false,
      );
    });

    it('treats an undefined body as no items', async () => {
      mockHandleRequest.mockResolvedValue({
        headers: { 'x-pages': '1' },
        body: undefined,
      });

      // toHaveLength, not toEqual([]): toEqual ignores undefined array items,
      // so [undefined] would pass.
      expect(await fetchAllPages(client, 'x', 'GET')).toHaveLength(0);
      const [first] = await collect(fetchPages(client, 'x', 'GET'));
      expect(first?.data).toHaveLength(0);
    });

    it('logs each extra page it fetches, with page and total', async () => {
      const logger = spyLogger();
      client.setLogger(logger);
      mockHandleRequest.mockResolvedValue({
        headers: { 'x-pages': '2' },
        body: [{ id: 1 }],
      });

      await fetchAllPages(client, 'alliances', 'GET');
      await collect(fetchPages(client, 'corps', 'GET'));

      expect(logCalls(logger)).toEqual([
        [
          'info',
          'Fetching page 2/2: alliances?page=2',
          { page: 2, totalPages: 2 },
        ],
        ['info', 'Fetching page 2/2: corps?page=2', { page: 2, totalPages: 2 }],
      ]);
    });

    it('rejects a page that fails its schema when validation is on', async () => {
      mockHandleRequest.mockResolvedValue({
        headers: { 'x-pages': '1' },
        body: [{ id: 'not a number' }],
      });

      await expect(
        fetchAllPages(
          client,
          'x',
          'GET',
          false,
          undefined,
          undefined,
          pageSchema,
        ),
      ).rejects.toBeInstanceOf(EsiValidationError);
      await expect(
        collect(
          fetchPages(
            client,
            'x',
            'GET',
            false,
            undefined,
            undefined,
            pageSchema,
          ),
        ),
      ).rejects.toBeInstanceOf(EsiValidationError);
    });

    it('returns the raw page when validation is off', async () => {
      client.setValidateResponse(false);
      mockHandleRequest.mockResolvedValue({
        headers: { 'x-pages': '1' },
        body: [{ id: 'not a number' }],
      });

      expect(
        await fetchAllPages(
          client,
          'x',
          'GET',
          false,
          undefined,
          undefined,
          pageSchema,
        ),
      ).toEqual([{ id: 'not a number' }]);
    });
  });
});
