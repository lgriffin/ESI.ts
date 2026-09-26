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

    it('should send the configured clientId as the X-User-Agent header', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      // README.md documents `clientId` as the User-Agent identifier, the one
      // handle ESI sees for this caller, so it must reach ESI on every call.
      expect(headers['X-User-Agent']).toBe('test');
    });

    it('should carry the default clientId in X-User-Agent when none is configured', () => {
      // EsiClient resolves config.clientId || ESI_CLIENT_ID || 'esi-client'
      // before the ApiClient is built; the pipeline must pass that value
      // through untouched.
      const defaultClient = new ApiClient('esi-client', BASE_URL);
      const headers = buildRequestHeaders(
        defaultClient,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['X-User-Agent']).toBe('esi-client');
    });

    it.each([
      ['a newline', 'my-app\nX-Injected: 1'],
      ['a control character', 'my-app\u0000'],
      ['non-ASCII text', 'my-app \u2603'],
      ['an empty string', ''],
    ])(
      'should leave X-User-Agent off when the clientId holds %s',
      (_label, clientId) => {
        // fetch throws on an illegal header value, which would fail every
        // request; the other headers must still be built.
        const badClient = new ApiClient(clientId, BASE_URL);
        const headers = buildRequestHeaders(
          badClient,
          `${BASE_URL}/v1/status/`,
          'GET',
          false,
          false,
          undefined,
          nullCache,
        ) as Record<string, string>;

        expect(headers).not.toHaveProperty('X-User-Agent');
        expect(headers['User-Agent']).toBeDefined();
      },
    );

    it('should keep a clientId with spaces and a tab in X-User-Agent', () => {
      const spacedClient = new ApiClient(
        'my app\t(contact: me@example.com)',
        BASE_URL,
      );
      const headers = buildRequestHeaders(
        spacedClient,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['X-User-Agent']).toBe('my app\t(contact: me@example.com)');
    });

    it('should use custom compatibility date when set on client', () => {
      client.setCompatibilityDate('2025-01-15');
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['X-Compatibility-Date']).toBe('2025-01-15');
    });

    it('should fall back to default compatibility date when not set', () => {
      const headers = buildRequestHeaders(
        client,
        `${BASE_URL}/v1/status/`,
        'GET',
        false,
        false,
        undefined,
        nullCache,
      ) as Record<string, string>;

      expect(headers['X-Compatibility-Date']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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

    it('should keep X-User-Agent alongside the Authorization header', () => {
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
      expect(headers['X-User-Agent']).toBe('test');
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
