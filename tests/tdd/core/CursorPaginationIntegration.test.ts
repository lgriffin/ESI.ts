import {
  handleRequest,
  resetETagCache,
} from '../../../src/core/ApiRequestHandler';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

/**
 * Integration tests for cursor-based pagination through handleRequest.
 * Verifies that cursor headers are detected and cursors are returned
 * in the response, while offset-based pagination still works.
 */
describe('Cursor Pagination Integration (handleRequest)', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    resetETagCache();
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net', undefined);
  });

  it('should detect cursor pagination and return cursors in response', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 1 }, { id: 2 }]), {
      headers: {
        'x-cursor-before': 'before-tok',
        'x-cursor-after': 'after-tok',
      },
    });

    const result = await handleRequest(
      client,
      'corporations/123/projects',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.cursors).toBeDefined();
    expect(result.cursors.before).toBe('before-tok');
    expect(result.cursors.after).toBe('after-tok');
  });

  it('should not return cursors for offset-based pagination', async () => {
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
    expect(result.cursors).toBeUndefined();
  });

  it('should return data without cursors when no pagination headers present', async () => {
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
    expect(result.cursors).toBeUndefined();
  });

  it('should pass cursor query params through to the endpoint', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 3 }]), {
      headers: {
        'x-cursor-before': 'b2',
        'x-cursor-after': 'a2',
      },
    });

    const result = await handleRequest(
      client,
      'corporations/123/projects?after=cursor-1',
      'GET',
      undefined,
      false,
      false,
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/corporations/123/projects?after=cursor-1',
    );
    expect(result.body).toEqual([{ id: 3 }]);
    expect(result.cursors.after).toBe('a2');
  });

  it('should not auto-paginate cursor responses (single page only)', async () => {
    // Cursor pagination does NOT auto-fetch subsequent pages.
    // It returns the single page + cursors for the caller to manage.
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 1 }, { id: 2 }]), {
      headers: {
        'x-cursor-after': 'next-cursor',
      },
    });

    const result = await handleRequest(
      client,
      'corporations/123/projects',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.body).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.cursors.after).toBe('next-cursor');
    // Only 1 fetch — no auto-pagination
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should return null cursors when only one cursor header is present', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 1 }]), {
      headers: {
        'x-cursor-after': 'after-only',
      },
    });

    const result = await handleRequest(
      client,
      'corporations/123/projects',
      'GET',
      undefined,
      false,
      false,
    );

    expect(result.cursors.before).toBeNull();
    expect(result.cursors.after).toBe('after-only');
  });
});
