import {
  fetchPages,
  PageResult,
} from '../../../src/core/pagination/AsyncPaginationIterator';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

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

    it('should stop early when a page returns empty data', async () => {
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

    it('should pass requiresAuth and body through to handleRequest', async () => {
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

      expect(mockHandleRequest).toHaveBeenCalledWith(
        client,
        'universe/names',
        'POST',
        requestBody,
        true,
      );
    });
  });
});
