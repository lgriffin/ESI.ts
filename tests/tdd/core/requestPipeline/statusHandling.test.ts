import {
  STATUS_MESSAGES,
  handleEarlyStatus,
  handleErrorResponse,
  wrapError,
} from '../../../../src/core/requestPipeline/statusHandling';
import { ApiClient } from '../../../../src/core/ApiClient';
import { EsiError } from '../../../../src/core/util/error';
import { ETagCacheManager } from '../../../../src/core/cache/ETagCacheManager';
import { CircuitOpenError } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { ParsedHeaders } from '../../../../src/core/util/headersUtil';

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/statusHandling', () => {
  describe('STATUS_MESSAGES', () => {
    it('should have messages for common HTTP statuses', () => {
      expect(STATUS_MESSAGES[404]).toBe('Resource not found');
      expect(STATUS_MESSAGES[429]).toBe('Too many requests');
      expect(STATUS_MESSAGES[500]).toBe('Internal server error');
      expect(STATUS_MESSAGES[503]).toBe('Service Unavailable');
    });

    it('should have messages for ESI-specific statuses', () => {
      expect(STATUS_MESSAGES[420]).toBe('Error Limited');
      expect(STATUS_MESSAGES[520]).toContain('terminate too soon');
    });
  });

  describe('handleEarlyStatus', () => {
    let client: ApiClient;
    const resolveCache = (c: ApiClient) => c.getCache();

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
    });

    it('should return response with undefined body for 201', () => {
      const parsed = {
        raw: { 'x-request-id': '123' },
      } as unknown as ParsedHeaders;
      const result = handleEarlyStatus(
        client,
        201,
        `${BASE_URL}/v1/test/`,
        parsed,
        false,
        resolveCache,
      );

      expect(result).not.toBeNull();
      expect(result!.body).toBeUndefined();
      expect(result!.headers).toEqual(parsed.raw);
    });

    it('should return response with undefined body for 204', () => {
      const parsed = { raw: {} } as unknown as ParsedHeaders;
      const result = handleEarlyStatus(
        client,
        204,
        `${BASE_URL}/v1/test/`,
        parsed,
        false,
        resolveCache,
      );

      expect(result).not.toBeNull();
      expect(result!.body).toBeUndefined();
    });

    it('should return cached data on 304 with cache hit', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 50 }, { 'content-type': 'json' });

      const parsed = {
        raw: { 'x-new': 'header' },
      } as unknown as ParsedHeaders;
      const result = handleEarlyStatus(
        client,
        304,
        url,
        parsed,
        true,
        resolveCache,
      );

      expect(result).not.toBeNull();
      expect(result!.fromCache).toBe(true);
      expect(result!.cacheHitType).toBe('etag-304');
      expect(result!.body).toEqual({ players: 50 });

      cache.shutdown();
    });

    it('should throw EsiError on 304 with no cached data', () => {
      const parsed = {
        raw: {},
        requestId: 'req-1',
      } as unknown as ParsedHeaders;

      expect(() =>
        handleEarlyStatus(
          client,
          304,
          `${BASE_URL}/v1/test/`,
          parsed,
          true,
          resolveCache,
        ),
      ).toThrow(EsiError);
    });

    it('should return null for non-early statuses like 200', () => {
      const parsed = { raw: {} } as unknown as ParsedHeaders;
      const result = handleEarlyStatus(
        client,
        200,
        `${BASE_URL}/v1/test/`,
        parsed,
        false,
        resolveCache,
      );

      expect(result).toBeNull();
    });

    it('should return null for error statuses like 500', () => {
      const parsed = { raw: {} } as unknown as ParsedHeaders;
      const result = handleEarlyStatus(
        client,
        500,
        `${BASE_URL}/v1/test/`,
        parsed,
        false,
        resolveCache,
      );

      expect(result).toBeNull();
    });
  });

  describe('handleErrorResponse', () => {
    let client: ApiClient;
    const resolveCache = (c: ApiClient) => c.getCache();

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
    });

    it('should throw EsiError for 420 status', () => {
      const response = new Response(null, { status: 420 });
      const parsed = { raw: {}, requestId: 'r1' } as unknown as ParsedHeaders;

      expect(() =>
        handleErrorResponse(
          client,
          response,
          `${BASE_URL}/v1/test/`,
          parsed,
          false,
          resolveCache,
        ),
      ).toThrow(EsiError);

      try {
        handleErrorResponse(
          client,
          response,
          `${BASE_URL}/v1/test/`,
          parsed,
          false,
          resolveCache,
        );
      } catch (e) {
        expect((e as EsiError).statusCode).toBe(420);
      }
    });

    it('should throw EsiError for 429 status', () => {
      const response = new Response(null, { status: 429 });
      const parsed = { raw: {}, requestId: 'r1' } as unknown as ParsedHeaders;

      expect(() =>
        handleErrorResponse(
          client,
          response,
          `${BASE_URL}/v1/test/`,
          parsed,
          false,
          resolveCache,
        ),
      ).toThrow(EsiError);

      try {
        handleErrorResponse(
          client,
          response,
          `${BASE_URL}/v1/test/`,
          parsed,
          false,
          resolveCache,
        );
      } catch (e) {
        expect((e as EsiError).statusCode).toBe(429);
      }
    });

    it('should serve stale cache on 500 when useETag is true and cache has data', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 50 }, { 'content-type': 'json' });

      const response = new Response(null, { status: 500 });
      const parsed = { raw: {} } as unknown as ParsedHeaders;

      const result = handleErrorResponse(
        client,
        response,
        url,
        parsed,
        true,
        resolveCache,
      );
      expect(result.fromCache).toBe(true);
      expect(result.stale).toBe(true);
      expect(result.body).toEqual({ players: 50 });

      cache.shutdown();
    });

    it('should not serve stale cache on 500 when useETag is false', () => {
      const cache = new ETagCacheManager({
        maxEntries: 100,
        defaultTtl: 60000,
      });
      client.setCache(cache);

      const url = `${BASE_URL}/v1/status/`;
      cache.set(url, '"etag"', { players: 50 }, { 'content-type': 'json' });

      const response = new Response(null, { status: 500 });
      const parsed = { raw: {} } as unknown as ParsedHeaders;

      expect(() =>
        handleErrorResponse(client, response, url, parsed, false, resolveCache),
      ).toThrow(EsiError);

      cache.shutdown();
    });

    it('should throw EsiError for 4xx that are not 420/429', () => {
      const response = new Response(null, { status: 404 });
      const parsed = { raw: {}, requestId: 'r1' } as unknown as ParsedHeaders;

      expect(() =>
        handleErrorResponse(
          client,
          response,
          `${BASE_URL}/v1/test/`,
          parsed,
          false,
          resolveCache,
        ),
      ).toThrow(EsiError);
    });
  });

  describe('wrapError', () => {
    it('should rethrow EsiError as-is', () => {
      const esiErr = new EsiError(404, 'Not found', '/test');
      expect(() => wrapError(esiErr)).toThrow(esiErr);
    });

    it('should rethrow CircuitOpenError as-is', () => {
      const cbErr = new CircuitOpenError('test-endpoint', 5, 30000);
      expect(() => wrapError(cbErr)).toThrow(cbErr);
    });

    it('should wrap generic Error into ESIJS_ERROR', () => {
      const err = new Error('something broke');
      expect(() => wrapError(err)).toThrow('something broke');
      expect(() => wrapError(err)).toThrow('ESIJS_ERROR');
    });

    it('should wrap string errors', () => {
      expect(() => wrapError('string error')).toThrow('string error');
      expect(() => wrapError('string error')).toThrow('ESIJS_ERROR');
    });
  });
});
