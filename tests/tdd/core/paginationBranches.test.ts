import { PaginationHandler } from '../../../src/core/pagination/PaginationHandler';
import { CursorPaginationHandler } from '../../../src/core/pagination/CursorPaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { handleOffsetPagination } from '../../../src/core/requestPipeline/paginationOrchestration';
import { resolveRateLimiter } from '../../../src/core/requestPipeline/dependencies';
import { ParsedHeaders } from '../../../src/core/util/headersUtil';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('PaginationHandler branch coverage', () => {
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

  it('should work without a rate limiter', async () => {
    const noRlClient = new ApiClient(
      'test',
      'https://esi.evetech.net',
      undefined,
    );
    pageFetch.mockResolvedValueOnce([{ id: 2 }]);

    const result = await PaginationHandler.fetchRemainingPages(
      noRlClient,
      'alliances',
      'GET',
      false,
      [{ id: 1 }],
      2,
      undefined,
      {},
      pageFetch,
    );

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should pass templatePath to rate limiter', async () => {
    pageFetch.mockResolvedValueOnce([{ id: 2 }]);

    const result = await PaginationHandler.fetchRemainingPages(
      client,
      'alliances',
      'GET',
      false,
      [{ id: 1 }],
      2,
      undefined,
      {},
      pageFetch,
      'alliances/',
    );

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should wrap non-Error thrown values in Error', async () => {
    pageFetch.mockRejectedValue('string error');

    await expect(
      PaginationHandler.fetchRemainingPages(
        client,
        'alliances',
        'GET',
        false,
        [{ id: 1 }],
        2,
        undefined,
        { maxRetries: 1, retryDelayMs: 1 },
        pageFetch,
      ),
    ).rejects.toThrow('Failed to fetch page 2: string error');
  });

  it('should stop when stopOnEmptyPage is true and page returns null', async () => {
    pageFetch.mockResolvedValueOnce(null as unknown as unknown[]);

    const result = await PaginationHandler.fetchRemainingPages(
      client,
      'alliances',
      'GET',
      false,
      [{ id: 1 }],
      3,
      undefined,
      { stopOnEmptyPage: true },
      pageFetch,
    );

    expect(result).toEqual([{ id: 1 }]);
  });
});

function cursorResponse(
  data: unknown[],
  before: string | null,
  after: string | null,
  status = 200,
) {
  const headers: Record<string, string> = {};
  if (before) headers['x-cursor-before'] = before;
  if (after) headers['x-cursor-after'] = after;
  return { status, headers, body: JSON.stringify(data) };
}

describe('CursorPaginationHandler branch coverage', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
    client.setRateLimiter(rateLimiter);
  });

  it('should delegate to pageFetch when provided', async () => {
    const mockPageFetch = jest.fn().mockResolvedValue({
      data: [{ id: 1 }],
      cursors: { before: null, after: null },
    });

    const result = await CursorPaginationHandler.fetchPage(
      client,
      'corps/123/projects',
      'GET',
      false,
      undefined,
      undefined,
      mockPageFetch,
    );

    expect(result.data).toEqual([{ id: 1 }]);
    expect(mockPageFetch).toHaveBeenCalledWith('corps/123/projects', undefined);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should rethrow non-abort errors from fetch', async () => {
    const networkError = new Error('Network failure');
    fetchMock.mockRejectOnce(networkError);

    await expect(
      CursorPaginationHandler.fetchPage(client, 'some/endpoint', 'GET', false),
    ).rejects.toThrow('Network failure');
  });

  it('should throw on invalid JSON response', async () => {
    fetchMock.mockResponseOnce('not json{{{', { status: 200 });

    await expect(
      CursorPaginationHandler.fetchPage(client, 'some/endpoint', 'GET', false),
    ).rejects.toThrow('Invalid JSON response');
  });

  it('should send body as JSON when provided', async () => {
    const resp = cursorResponse([{ id: 1 }], null, null);
    fetchMock.mockResponseOnce(resp.body, {
      status: resp.status,
      headers: resp.headers,
    });

    await CursorPaginationHandler.fetchPage(
      client,
      'some/endpoint',
      'POST',
      false,
      undefined,
      { ids: [1, 2, 3] },
    );

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions?.body).toBe(JSON.stringify({ ids: [1, 2, 3] }));
  });

  it('fetchAll should use pageFetch delegate for subsequent pages', async () => {
    const mockPageFetch = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 2 }],
        cursors: { before: null, after: 'c2' },
      })
      .mockResolvedValueOnce({
        data: [],
        cursors: { before: null, after: null },
      });

    const result = await CursorPaginationHandler.fetchAll(
      client,
      'corps/123/projects',
      'GET',
      false,
      [{ id: 1 }],
      { before: null, after: 'c1' },
      undefined,
      {},
      mockPageFetch,
    );

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetchAll should work without a rate limiter', async () => {
    const noRlClient = new ApiClient(
      'test',
      'https://esi.evetech.net',
      undefined,
    );

    const resp = cursorResponse([], null, null);
    fetchMock.mockResponseOnce(resp.body, {
      status: resp.status,
      headers: resp.headers,
    });

    const result = await CursorPaginationHandler.fetchAll(
      noRlClient,
      'corps/123/projects',
      'GET',
      false,
      [{ id: 1 }],
      { before: null, after: 'c1' },
    );

    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('resolveRateLimiter', () => {
  it('should throw when no rate limiter is configured', () => {
    const noRlClient = new ApiClient(
      'test',
      'https://esi.evetech.net',
      undefined,
    );

    expect(() => resolveRateLimiter(noRlClient)).toThrow(
      'No rate limiter configured',
    );
  });
});

describe('handleOffsetPagination branch coverage', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
    client.setRateLimiter(rateLimiter);
  });

  it('should wrap generic errors in PAGINATION_INCOMPLETE', async () => {
    const pageFetch = jest
      .fn()
      .mockRejectedValue(new TypeError('fetch failed'));

    const parsed = {
      raw: {},
      xPages: 3,
      hasCursorPagination: false,
      cursorBefore: null,
      cursorAfter: null,
    } as unknown as ParsedHeaders;

    await expect(
      handleOffsetPagination(
        client,
        'alliances',
        'GET',
        false,
        parsed,
        [{ id: 1 }],
        undefined,
        'https://esi.evetech.net/alliances',
        false,
        pageFetch,
        () => null,
      ),
    ).rejects.toThrow('Pagination incomplete');
  });
});
