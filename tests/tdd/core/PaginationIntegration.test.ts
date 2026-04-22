import {
  handleRequest,
  resetETagCache,
} from '../../../src/core/ApiRequestHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

/**
 * Integration tests for pagination through handleRequest.
 * Verifies that page 1 is NOT fetched twice and that query params are preserved.
 */
describe('Pagination Integration (handleRequest)', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    resetETagCache();
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
  });

  it('should return single-page data without extra fetches', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([1, 2, 3]), {
      headers: { 'x-pages': '1' },
    });

    const result = await handleRequest(
      client,
      'alliances',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should fetch page 1 only once for multi-page responses', async () => {
    // Page 1 from handleRequest
    fetchMock.mockResponseOnce(JSON.stringify([1, 2]), {
      headers: { 'x-pages': '3' },
    });
    // Page 2 from PaginationHandler
    fetchMock.mockResponseOnce(JSON.stringify([3, 4]));
    // Page 3 from PaginationHandler
    fetchMock.mockResponseOnce(JSON.stringify([5, 6]));

    const result = await handleRequest(
      client,
      'alliances',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual([1, 2, 3, 4, 5, 6]);
    // 3 total fetches: page 1 (handleRequest) + pages 2,3 (PaginationHandler)
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify page 1 was the initial request
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/alliances',
    );
    // Verify pages 2 and 3 are correctly numbered
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://esi.evetech.net/alliances?page=2',
    );
    expect(fetchMock.mock.calls[2][0]).toBe(
      'https://esi.evetech.net/alliances?page=3',
    );
  });

  it('should preserve query params during pagination', async () => {
    // Page 1 with query params
    fetchMock.mockResponseOnce(JSON.stringify([{ order_id: 1 }]), {
      headers: { 'x-pages': '2' },
    });
    // Page 2 should also have the query params
    fetchMock.mockResponseOnce(JSON.stringify([{ order_id: 2 }]));

    const endpoint = 'markets/10000002/orders?order_type=all';
    const result = await handleRequest(
      client,
      endpoint,
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual([{ order_id: 1 }, { order_id: 2 }]);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://esi.evetech.net/markets/10000002/orders?order_type=all&page=2',
    );
  });

  it('should return first page data if pagination fails', async () => {
    // Page 1 succeeds
    fetchMock.mockResponseOnce(JSON.stringify([1, 2]), {
      headers: { 'x-pages': '2' },
    });
    // Page 2 always fails — PaginationHandler will retry and eventually give up
    fetchMock.mockResponse('Server Error', { status: 500 });

    const result = await handleRequest(
      client,
      'alliances',
      'GET',
      undefined,
      false,
      false,
    );

    // Should still get page 1 data (graceful degradation)
    expect(result.body).toEqual([1, 2]);
  }, 15000);

  it('should handle x-pages header absent (defaults to 1 page)', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ server_version: '1.0' }));

    const result = await handleRequest(
      client,
      'status',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual({ server_version: '1.0' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
