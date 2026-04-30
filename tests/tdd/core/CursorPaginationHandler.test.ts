import { CursorPaginationHandler } from '../../../src/core/pagination/CursorPaginationHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

/** Helper to create a mock response with cursor headers */
function cursorResponse(
  data: any[],
  before: string | null,
  after: string | null,
  status = 200,
) {
  const headers: Record<string, string> = {};
  if (before) headers['x-cursor-before'] = before;
  if (after) headers['x-cursor-after'] = after;
  return { status, headers, body: JSON.stringify(data) };
}

describe('CursorPaginationHandler', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
    client.setRateLimiter(rateLimiter);
  });

  describe('fetchPage', () => {
    it('should fetch a single page and return data with cursors', async () => {
      const resp = cursorResponse(
        [{ id: 1 }, { id: 2 }],
        'tok-before',
        'tok-after',
      );
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      const result = await CursorPaginationHandler.fetchPage(
        client,
        'corporations/123/projects',
        'GET',
        false,
      );

      expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.cursors.before).toBe('tok-before');
      expect(result.cursors.after).toBe('tok-after');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/123/projects',
      );
    });

    it('should append after cursor as query parameter', async () => {
      const resp = cursorResponse([{ id: 3 }], 'b2', 'a2');
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchPage(
        client,
        'corporations/123/projects',
        'GET',
        false,
        { after: 'tok-after-1' },
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/123/projects?after=tok-after-1',
      );
    });

    it('should append before cursor as query parameter', async () => {
      const resp = cursorResponse([{ id: 1 }], 'b1', 'a1');
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchPage(
        client,
        'corporations/123/projects',
        'GET',
        false,
        { before: 'tok-before-1' },
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/123/projects?before=tok-before-1',
      );
    });

    it('should preserve existing query params when adding cursor', async () => {
      const resp = cursorResponse([{ id: 1 }], null, 'a1');
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchPage(
        client,
        'corporations/123/projects?status=active',
        'GET',
        false,
        { after: 'cursor1' },
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/123/projects?status=active&after=cursor1',
      );
    });

    it('should include auth header when requiresAuth is true', async () => {
      const authedClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const resp = cursorResponse([{ id: 1 }], null, null);
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchPage(
        authedClient,
        'corporations/123/projects',
        'GET',
        true,
      );

      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('should throw on HTTP error', async () => {
      fetchMock.mockResponseOnce('Server Error', { status: 500 });

      await expect(
        CursorPaginationHandler.fetchPage(
          client,
          'corporations/123/projects',
          'GET',
          false,
        ),
      ).rejects.toThrow('HTTP 500');
    });

    it('should return null cursors when no cursor headers present', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([{ id: 1 }]));

      const result = await CursorPaginationHandler.fetchPage(
        client,
        'some/endpoint',
        'GET',
        false,
      );

      expect(result.data).toEqual([{ id: 1 }]);
      expect(result.cursors.before).toBeNull();
      expect(result.cursors.after).toBeNull();
    });

    it('should URL-encode cursor tokens', async () => {
      const resp = cursorResponse([{ id: 1 }], null, null);
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchPage(
        client,
        'corporations/123/projects',
        'GET',
        false,
        { after: 'token with spaces&special=chars' },
      );

      expect(fetchMock.mock.calls[0][0]).toContain(
        'after=token%20with%20spaces%26special%3Dchars',
      );
    });

    it('should wrap non-array JSON responses in an array', async () => {
      const resp = cursorResponse([] as any, null, null);
      fetchMock.mockResponseOnce(JSON.stringify({ id: 1, name: 'single' }), {
        headers: { 'x-cursor-after': 'a1' },
      });

      const result = await CursorPaginationHandler.fetchPage(
        client,
        'some/endpoint',
        'GET',
        false,
      );

      expect(result.data).toEqual([{ id: 1, name: 'single' }]);
    });
  });

  describe('fetchAll', () => {
    it('should return first page data when after cursor is null', async () => {
      const firstPageData = [{ id: 1 }, { id: 2 }];
      const cursors = { before: 'b1', after: null };

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        cursors,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should fetch subsequent pages until empty response', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'cursor-1' };

      // Page 2: returns data with another after cursor
      const resp2 = cursorResponse([{ id: 2 }], 'b2', 'cursor-2');
      fetchMock.mockResponseOnce(resp2.body, {
        status: resp2.status,
        headers: resp2.headers,
      });

      // Page 3: returns empty (end of dataset)
      const resp3 = cursorResponse([], 'b3', 'cursor-3');
      fetchMock.mockResponseOnce(resp3.body, {
        status: resp3.status,
        headers: resp3.headers,
      });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should stop when after cursor becomes null', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'cursor-1' };

      // Page 2: returns data with no after cursor
      const resp2 = cursorResponse([{ id: 2 }], 'b2', null);
      fetchMock.mockResponseOnce(resp2.body, {
        status: resp2.status,
        headers: resp2.headers,
      });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should pass after token as query parameter on subsequent fetches', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'my-cursor' };

      const resp = cursorResponse([], null, null);
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });

      await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/123/projects?after=my-cursor',
      );
    });

    it('should respect maxPages option', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'c1' };

      // Page 2
      const resp2 = cursorResponse([{ id: 2 }], null, 'c2');
      fetchMock.mockResponseOnce(resp2.body, {
        status: resp2.status,
        headers: resp2.headers,
      });

      // Page 3 should not be fetched due to maxPages: 2
      const resp3 = cursorResponse([{ id: 3 }], null, 'c3');
      fetchMock.mockResponseOnce(resp3.body, {
        status: resp3.status,
        headers: resp3.headers,
      });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
        undefined,
        { maxPages: 2 },
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should retry failed page fetches', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'c1' };

      // Fail once, then succeed, then empty (end)
      fetchMock.mockResponseOnce('Server Error', { status: 500 });
      const resp = cursorResponse([{ id: 2 }], null, 'c2');
      fetchMock.mockResponseOnce(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });
      const respEmpty = cursorResponse([], null, null);
      fetchMock.mockResponseOnce(respEmpty.body, {
        status: respEmpty.status,
        headers: respEmpty.headers,
      });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
        undefined,
        { maxRetries: 3, retryDelayMs: 1 },
      );

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should stop after maxRetries consecutive failures', async () => {
      const firstPageData = [{ id: 1 }];
      const firstCursors = { before: null, after: 'c1' };

      // All fetches fail
      fetchMock.mockResponse('Server Error', { status: 500 });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
        undefined,
        { maxRetries: 3, retryDelayMs: 1 },
      );

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle duplicates across pages (per ESI spec)', async () => {
      const firstPageData = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const firstCursors = { before: null, after: 'c1' };

      // Page 2 has B again (modified between requests) plus new items
      const resp2 = cursorResponse(
        [{ id: 'D' }, { id: 'B' }, { id: 'E' }],
        null,
        'c2',
      );
      fetchMock.mockResponseOnce(resp2.body, {
        status: resp2.status,
        headers: resp2.headers,
      });

      const respEmpty = cursorResponse([], null, null);
      fetchMock.mockResponseOnce(respEmpty.body, {
        status: respEmpty.status,
        headers: respEmpty.headers,
      });

      const result = await CursorPaginationHandler.fetchAll(
        client,
        'corporations/123/projects',
        'GET',
        false,
        firstPageData,
        firstCursors,
      );

      // Duplicates are preserved — caller is responsible for dedup
      expect(result).toEqual([
        { id: 'A' },
        { id: 'B' },
        { id: 'C' },
        { id: 'D' },
        { id: 'B' },
        { id: 'E' },
      ]);
    });
  });

  describe('extractCursors', () => {
    it('should extract both cursor headers', () => {
      const headers = new Headers({
        'x-cursor-before': 'before-token',
        'x-cursor-after': 'after-token',
      });

      const cursors = CursorPaginationHandler.extractCursors(headers);

      expect(cursors.before).toBe('before-token');
      expect(cursors.after).toBe('after-token');
    });

    it('should return null for missing cursor headers', () => {
      const headers = new Headers({});

      const cursors = CursorPaginationHandler.extractCursors(headers);

      expect(cursors.before).toBeNull();
      expect(cursors.after).toBeNull();
    });

    it('should handle only one cursor header present', () => {
      const headers = new Headers({ 'x-cursor-after': 'after-only' });

      const cursors = CursorPaginationHandler.extractCursors(headers);

      expect(cursors.before).toBeNull();
      expect(cursors.after).toBe('after-only');
    });
  });
});
