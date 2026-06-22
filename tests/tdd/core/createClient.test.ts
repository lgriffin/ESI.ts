import { ApiClient } from '../../../src/core/ApiClient';
import {
  createClient,
  fetchAllCursorPages,
} from '../../../src/core/endpoints/createClient';
import { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import * as loggerUtil from '../../../src/core/logger/loggerUtil';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('createClient', () => {
  let apiClient: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('test', BASE_URL);
    apiClient.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('datasource parameter', () => {
    const endpoints = {
      getStatus: {
        path: 'latest/status/',
        method: 'GET' as const,
        requiresAuth: false,
      },
    } satisfies EndpointMap;

    it('should not append datasource when not configured', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }));
      const client = createClient(apiClient, endpoints);
      await client.getStatus();

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).not.toContain('datasource');
    });

    it('should append datasource=singularity when configured', async () => {
      apiClient.setDatasource('singularity');
      fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }));
      const client = createClient(apiClient, endpoints);
      await client.getStatus();

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('datasource=singularity');
    });

    it('should append datasource with correct separator when query params exist', async () => {
      const endpointsWithQuery = {
        getMarketOrders: {
          path: 'latest/markets/{regionId}/orders/',
          method: 'GET' as const,
          requiresAuth: false,
          pathParams: ['regionId'] as const,
          queryParams: { typeId: 'type_id' },
        },
      } satisfies EndpointMap;

      apiClient.setDatasource('tranquility');
      fetchMock.mockResponseOnce(JSON.stringify([]));
      const client = createClient(apiClient, endpointsWithQuery);
      await client.getMarketOrders(10000002, 34);

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('type_id=34');
      expect(calledUrl).toContain('&datasource=tranquility');
    });
  });

  describe('input validation', () => {
    const endpoints = {
      getAlliance: {
        path: 'latest/alliances/{allianceId}/',
        method: 'GET' as const,
        requiresAuth: false,
        pathParams: ['allianceId'] as const,
      },
      getMarketOrders: {
        path: 'latest/markets/{regionId}/orders/',
        method: 'GET' as const,
        requiresAuth: false,
        pathParams: ['regionId'] as const,
        queryParams: { typeId: 'type_id' },
      },
    } satisfies EndpointMap;

    it('should reject empty path parameters', async () => {
      const client = createClient(apiClient, endpoints);
      await expect(client.getAlliance('')).rejects.toThrow('must not be empty');
    });

    it('should reject path parameters with slashes', async () => {
      const client = createClient(apiClient, endpoints);
      await expect(client.getAlliance('../foo')).rejects.toThrow(
        'invalid characters',
      );
    });

    it('should reject NaN path parameters', async () => {
      const client = createClient(apiClient, endpoints);
      await expect(client.getAlliance(NaN)).rejects.toThrow('finite number');
    });

    it('should accept valid numeric path parameters', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ alliance_id: 99003214 }));
      const client = createClient(apiClient, endpoints);
      await client.getAlliance(99003214);

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('/alliances/99003214/');
    });
  });

  describe('cursor pagination', () => {
    const cursorEndpoints = {
      getItems: {
        path: 'latest/items/',
        method: 'GET' as const,
        requiresAuth: false,
        cursorPagination: true,
      },
    } satisfies EndpointMap;

    it('should return CursorResult for cursor-paginated endpoints', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([1, 2, 3]), {
        headers: {
          'x-cursor-before': 'abc',
          'x-cursor-after': 'def',
        },
      });

      const client = createClient(apiClient, cursorEndpoints);
      const result = (await client.getItems()) as {
        data: number[];
        cursors: { before: string | null; after: string | null };
      };

      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should append before and after query params', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([1]));

      const client = createClient(apiClient, cursorEndpoints);
      const getItems = client.getItems as (
        ...args: unknown[]
      ) => Promise<unknown>;
      await getItems({ before: 'abc', after: 'def' });

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('before=abc');
      expect(calledUrl).toContain('after=def');
    });

    it('should append only before when after is absent', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([1]));

      const client = createClient(apiClient, cursorEndpoints);
      const getItems = client.getItems as (
        ...args: unknown[]
      ) => Promise<unknown>;
      await getItems({ before: 'xyz' });

      const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('before=xyz');
      expect(calledUrl).not.toContain('after=');
    });

    it('should wrap non-array response body in array', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ id: 1 }));

      const client = createClient(apiClient, cursorEndpoints);
      const result = (await client.getItems()) as { data: unknown[] };

      expect(result.data).toEqual([{ id: 1 }]);
    });

    it('should return empty array for null response body', async () => {
      fetchMock.mockResponseOnce('null');

      const client = createClient(apiClient, cursorEndpoints);
      const result = (await client.getItems()) as { data: unknown[] };

      expect(result.data).toEqual([]);
    });

    it('should include metadata when returnMetadata is true', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([1, 2]));

      const client = createClient(apiClient, cursorEndpoints, {
        returnMetadata: true,
      });
      const result = (await client.getItems()) as {
        data: { data: number[] };
        meta: Record<string, unknown>;
      };

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.headers).toBeDefined();
    });
  });

  describe('fetchAllCursorPages', () => {
    it('should accumulate items across multiple pages', async () => {
      let callCount = 0;
      const fetcher = async (_b?: string, after?: string) => {
        callCount++;
        if (!after) return { items: [1, 2], cursor: { after: 'page2' } };
        if (after === 'page2')
          return { items: [3, 4], cursor: { after: null } };
        return { items: [], cursor: { after: null } };
      };

      const result = await fetchAllCursorPages(
        fetcher,
        (r) => r.items,
        (r) => r.cursor,
      );

      expect(result).toEqual([1, 2, 3, 4]);
      expect(callCount).toBe(2);
    });

    it('should stop when first page returns empty items', async () => {
      const fetcher = async () => ({
        items: [] as number[],
        cursor: { after: 'next' },
      });

      const result = await fetchAllCursorPages(
        fetcher,
        (r) => r.items,
        (r) => r.cursor,
      );

      expect(result).toEqual([]);
    });

    it('should stop when cursor.after is null', async () => {
      const fetcher = async () => ({
        items: [1, 2, 3],
        cursor: { after: null as string | null },
      });

      const result = await fetchAllCursorPages(
        fetcher,
        (r) => r.items,
        (r) => r.cursor,
      );

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('deprecation warnings', () => {
    const warnSpy = jest.spyOn(loggerUtil, 'logWarn');

    beforeEach(() => {
      warnSpy.mockClear();
    });

    afterAll(() => {
      warnSpy.mockRestore();
    });

    it('should log a warning when a deprecated endpoint is called', async () => {
      const endpoints = {
        getOldThing: {
          path: 'latest/old/',
          method: 'GET' as const,
          requiresAuth: false,
          deprecated: { message: 'This endpoint is going away.' },
        },
      } satisfies EndpointMap;

      fetchMock.mockResponseOnce(JSON.stringify({}));
      const client = createClient(apiClient, endpoints);
      await client.getOldThing();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("'getOldThing' is deprecated"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('This endpoint is going away.'),
      );
    });

    it('should include replacedBy in the warning', async () => {
      const endpoints = {
        getLegacy: {
          path: 'latest/legacy/',
          method: 'GET' as const,
          requiresAuth: false,
          deprecated: { replacedBy: 'getModern' },
        },
      } satisfies EndpointMap;

      fetchMock.mockResponseOnce(JSON.stringify({}));
      const client = createClient(apiClient, endpoints);
      await client.getLegacy();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Use 'getModern' instead"),
      );
    });

    it('should include sunsetDate in the warning', async () => {
      const endpoints = {
        getSunset: {
          path: 'latest/sunset/',
          method: 'GET' as const,
          requiresAuth: false,
          deprecated: { sunsetDate: '2026-06-01' },
        },
      } satisfies EndpointMap;

      fetchMock.mockResponseOnce(JSON.stringify({}));
      const client = createClient(apiClient, endpoints);
      await client.getSunset();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sunset date: 2026-06-01'),
      );
    });

    it('should not log a warning for non-deprecated endpoints', async () => {
      const endpoints = {
        getCurrent: {
          path: 'latest/current/',
          method: 'GET' as const,
          requiresAuth: false,
        },
      } satisfies EndpointMap;

      fetchMock.mockResponseOnce(JSON.stringify({}));
      const client = createClient(apiClient, endpoints);
      await client.getCurrent();

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('deprecated'),
      );
    });
  });
});
