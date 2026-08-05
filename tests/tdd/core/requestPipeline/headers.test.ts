import {
  buildRequestHeaders,
  parseCacheControlTtl,
} from '../../../../src/core/requestPipeline/headers';
import { ApiClient } from '../../../../src/core/ApiClient';
import { ICache } from '../../../../src/core/cache/ICache';

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/headers', () => {
  describe('parseCacheControlTtl', () => {
    it('should return undefined when no cache-control header exists', () => {
      expect(parseCacheControlTtl({})).toBeUndefined();
    });

    it('should parse max-age from lowercase cache-control header', () => {
      expect(parseCacheControlTtl({ 'cache-control': 'max-age=300' })).toBe(
        300_000,
      );
    });

    it('should parse max-age from mixed-case Cache-Control header', () => {
      expect(parseCacheControlTtl({ 'Cache-Control': 'max-age=60' })).toBe(
        60_000,
      );
    });

    it('should return undefined when cache-control has no max-age', () => {
      expect(
        parseCacheControlTtl({ 'cache-control': 'no-cache, no-store' }),
      ).toBeUndefined();
    });

    it('should parse max-age when mixed with other directives', () => {
      expect(
        parseCacheControlTtl({
          'cache-control': 'public, max-age=120, must-revalidate',
        }),
      ).toBe(120_000);
    });

    it('should handle max-age=0', () => {
      expect(parseCacheControlTtl({ 'cache-control': 'max-age=0' })).toBe(0);
    });
  });

  describe('buildRequestHeaders', () => {
    let client: ApiClient;
    const nullCache = () => null;

    beforeEach(() => {
      client = new ApiClient('test', BASE_URL);
    });

    it('should include standard headers', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['Accept']).toBe('application/json');
      expect(headers['Accept-Encoding']).toBe('gzip, deflate, br');
      expect(headers['User-Agent']).toMatch(/esi\.ts/);
      expect(headers['X-Compatibility-Date']).toBeDefined();
    });

    it('should include Accept-Language when language is set', () => {
      client.setLanguage('de');
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['Accept-Language']).toBe('de');
    });

    it('should not include Accept-Language when language is not set', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['Accept-Language']).toBeUndefined();
    });

    it('should throw when requiresAuth is true and no token', () => {
      expect(() =>
        buildRequestHeaders(
          client,
          `${BASE_URL}/v1/characters/123/`,
          'GET',
          true,
          false,
          undefined,
          nullCache,
        ),
      ).toThrow('Authorization header is required');
    });

    it('should include Authorization header when token is set', () => {
      client.setAccessToken('my-token');
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/characters/123/`,
        'GET',
        true,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('should include Content-Type when body is provided', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'POST',
        false,
        false,
        { foo: 'bar' },
        nullCache,
      ) as Record<string, string>;

      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Content-Type when body is not provided', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['Content-Type']).toBeUndefined();
    });

    it('should include If-None-Match header when useETag is true and cache has an ETag', () => {
      const mockCache: Partial<ICache> = {
        getETag: jest.fn().mockReturnValue('"etag-abc"'),
      };
      const withCache = () => mockCache as ICache;

      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        true,
        undefined,
        withCache,
      ) as Record<string, string>;

      expect(headers['If-None-Match']).toBe('"etag-abc"');
    });

    it('should not include If-None-Match for non-GET methods', () => {
      const mockCache: Partial<ICache> = {
        getETag: jest.fn().mockReturnValue('"etag-abc"'),
      };
      const withCache = () => mockCache as ICache;

      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'POST',
        false,
        true,
        undefined,
        withCache,
      ) as Record<string, string>;

      expect(headers['If-None-Match']).toBeUndefined();
    });
  });
});
