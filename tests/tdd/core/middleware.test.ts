import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  MiddlewareManager,
  RequestContext,
  ResponseContext,
} from '../../../src/core/middleware/Middleware';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('Middleware', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('MiddlewareManager', () => {
    it('should run request interceptors in order', async () => {
      const manager = new MiddlewareManager();
      const order: number[] = [];

      manager.addRequestInterceptor((ctx) => {
        order.push(1);
        return { ...ctx, headers: { ...ctx.headers, 'X-First': 'true' } };
      });
      manager.addRequestInterceptor((ctx) => {
        order.push(2);
        return { ...ctx, headers: { ...ctx.headers, 'X-Second': 'true' } };
      });

      const result = await manager.applyRequestInterceptors({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        headers: {},
      });

      expect(order).toEqual([1, 2]);
      expect(result.headers['X-First']).toBe('true');
      expect(result.headers['X-Second']).toBe('true');
    });

    it('should run response interceptors in order', async () => {
      const manager = new MiddlewareManager();
      const order: number[] = [];

      manager.addResponseInterceptor((ctx) => {
        order.push(1);
        return ctx;
      });
      manager.addResponseInterceptor((ctx) => {
        order.push(2);
        return ctx;
      });

      await manager.applyResponseInterceptors({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        status: 200,
        headers: {},
        body: {},
        durationMs: 10,
        fromCache: false,
      });

      expect(order).toEqual([1, 2]);
    });

    it('should return removal function that unregisters interceptor', () => {
      const manager = new MiddlewareManager();
      const remove = manager.addRequestInterceptor((ctx) => ctx);

      expect(manager.hasInterceptors()).toBe(true);

      remove();
      expect(manager.hasInterceptors()).toBe(false);
    });

    it('should clear all interceptors', () => {
      const manager = new MiddlewareManager();
      manager.addRequestInterceptor((ctx) => ctx);
      manager.addResponseInterceptor((ctx) => ctx);

      expect(manager.hasInterceptors()).toBe(true);

      manager.clear();
      expect(manager.hasInterceptors()).toBe(false);
    });
  });

  describe('Integration with handleRequest', () => {
    it('should apply request interceptor headers to outgoing request', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      client.addRequestInterceptor((ctx: RequestContext) => ({
        ...ctx,
        headers: { ...ctx.headers, 'X-Trace-Id': 'abc-123' },
      }));

      fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }));

      await handleRequest(client, 'v1/status/', 'GET');

      const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(requestHeaders['X-Trace-Id']).toBe('abc-123');
    });

    it('should apply response interceptor to transform body', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      client.addResponseInterceptor((ctx: ResponseContext) => ({
        ...ctx,
        body: { ...(ctx.body as Record<string, unknown>), injected: true },
      }));

      fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }));

      const result = await handleRequest(client, 'v1/status/', 'GET');

      expect((result.body as Record<string, unknown>).injected).toBe(true);
      expect((result.body as Record<string, unknown>).status).toBe('ok');
    });

    it('should provide durationMs in response context', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      let capturedDuration = -1;

      client.addResponseInterceptor((ctx: ResponseContext) => {
        capturedDuration = ctx.durationMs;
        return ctx;
      });

      fetchMock.mockResponseOnce(JSON.stringify({}));

      await handleRequest(client, 'v1/status/', 'GET');

      expect(capturedDuration).toBeGreaterThanOrEqual(0);
    });

    it('should allow removing interceptor at runtime', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      const remove = client.addRequestInterceptor((ctx: RequestContext) => ({
        ...ctx,
        headers: { ...ctx.headers, 'X-Custom': 'yes' },
      }));

      fetchMock.mockResponseOnce(JSON.stringify({}));
      await handleRequest(client, 'v1/status/', 'GET');

      let headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['X-Custom']).toBe('yes');

      remove();
      fetchMock.mockResponseOnce(JSON.stringify({}));
      await handleRequest(client, 'v1/status/', 'GET');

      headers = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>;
      expect(headers['X-Custom']).toBeUndefined();
    });
  });
});
