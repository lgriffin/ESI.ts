import {
  applyRequestMiddleware,
  applyResponseInterceptors,
} from '../../../../src/core/requestPipeline/middlewareBridge';
import { ApiClient } from '../../../../src/core/ApiClient';
import type { EsiHandlerResponse } from '../../../../src/core/requestPipeline/cachePolicy';

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/middlewareBridge', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('test', BASE_URL);
  });

  describe('applyRequestMiddleware', () => {
    it('should pass through unchanged when no interceptors', async () => {
      const result = await applyRequestMiddleware(
        client,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        { Accept: 'application/json' },
        undefined,
      );

      expect(result.url).toBe(`${BASE_URL}/v1/status/`);
      expect(result.headers).toEqual({ Accept: 'application/json' });
      expect(result.body).toBeUndefined();
    });

    it('should apply request interceptors when present', async () => {
      client.addRequestInterceptor((ctx) => ({
        ...ctx,
        headers: { ...ctx.headers, 'X-Custom': 'test' },
      }));

      const result = await applyRequestMiddleware(
        client,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        { Accept: 'application/json' },
        undefined,
      );

      expect(result.headers['X-Custom']).toBe('test');
    });
  });

  describe('applyResponseInterceptors', () => {
    it('should pass through unchanged when no interceptors', async () => {
      const handlerResult: EsiHandlerResponse = {
        headers: { 'content-type': 'application/json' },
        body: { players: 100 },
        status: 200,
      };

      const result = await applyResponseInterceptors(
        client,
        handlerResult,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        Date.now(),
      );

      expect(result).toBe(handlerResult);
    });

    it('should default to status 200 when result.status is undefined', async () => {
      client.addResponseInterceptor((ctx) => {
        expect(ctx.status).toBe(200);
        return ctx;
      });

      const handlerResult: EsiHandlerResponse = {
        headers: { 'content-type': 'application/json' },
        body: { players: 100 },
      };

      await applyResponseInterceptors(
        client,
        handlerResult,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        Date.now(),
      );
    });

    it('should default fromCache to false when not set', async () => {
      client.addResponseInterceptor((ctx) => {
        expect(ctx.fromCache).toBe(false);
        return ctx;
      });

      const handlerResult: EsiHandlerResponse = {
        headers: {},
        body: null,
        status: 200,
      };

      await applyResponseInterceptors(
        client,
        handlerResult,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        Date.now(),
      );
    });

    it('should apply response interceptors and return modified result', async () => {
      client.addResponseInterceptor((ctx) => ({
        ...ctx,
        body: { modified: true },
      }));

      const handlerResult: EsiHandlerResponse = {
        headers: { 'content-type': 'application/json' },
        body: { players: 100 },
        status: 200,
      };

      const result = await applyResponseInterceptors(
        client,
        handlerResult,
        `${BASE_URL}/v1/status/`,
        'v1/status/',
        'GET',
        Date.now(),
      );

      expect(result.body).toEqual({ modified: true });
    });
  });
});
