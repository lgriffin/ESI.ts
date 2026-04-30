import { ApiClient } from '../../../src/core/ApiClient';
import { createClient } from '../../../src/core/endpoints/createClient';
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
