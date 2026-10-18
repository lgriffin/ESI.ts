import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  MiddlewareManager,
  RequestContext,
  ResponseContext,
} from '../../../src/core/middleware/Middleware';
import fetchMock from 'jest-fetch-mock';
import { useFakeDate } from '../helpers/fakeDate';

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

    it('should return removal function that unregisters interceptor', async () => {
      const manager = new MiddlewareManager();
      const calls: number[] = [];
      const remove = manager.addRequestInterceptor((ctx) => {
        calls.push(1);
        return ctx;
      });

      expect(manager.hasInterceptors()).toBe(true);

      await manager.applyRequestInterceptors({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        headers: {},
      });
      expect(calls).toEqual([1]);

      remove();
      expect(manager.hasInterceptors()).toBe(false);

      calls.length = 0;
      await manager.applyRequestInterceptors({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        headers: {},
      });
      expect(calls).toEqual([]);
    });

    it('should remove only the specified response interceptor', async () => {
      const manager = new MiddlewareManager();
      const order: number[] = [];

      manager.addResponseInterceptor((ctx) => {
        order.push(1);
        return ctx;
      });
      const remove = manager.addResponseInterceptor((ctx) => {
        order.push(2);
        return ctx;
      });
      manager.addResponseInterceptor((ctx) => {
        order.push(3);
        return ctx;
      });

      remove();

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

      expect(order).toEqual([1, 3]);
    });

    it('should remove only the specified request interceptor', async () => {
      const manager = new MiddlewareManager();
      const order: number[] = [];

      manager.addRequestInterceptor((ctx) => {
        order.push(1);
        return ctx;
      });
      const remove = manager.addRequestInterceptor((ctx) => {
        order.push(2);
        return ctx;
      });
      manager.addRequestInterceptor((ctx) => {
        order.push(3);
        return ctx;
      });

      remove();

      await manager.applyRequestInterceptors({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        headers: {},
      });

      expect(order).toEqual([1, 3]);
    });

    it('should clear all interceptors', () => {
      const manager = new MiddlewareManager();
      manager.addRequestInterceptor((ctx) => ctx);
      manager.addResponseInterceptor((ctx) => ctx);

      expect(manager.hasInterceptors()).toBe(true);

      manager.clear();
      expect(manager.hasInterceptors()).toBe(false);
    });

    describe('withholdRequestHeaders', () => {
      const request = (headers: Record<string, string>): RequestContext => ({
        url: 'http://test',
        endpoint: 'test',
        method: 'GET',
        headers,
      });

      it('removes a withheld header whatever its case', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('Authorization');

        const lower = await manager.applyRequestInterceptors(
          request({ authorization: 'Bearer a', Accept: 'application/json' }),
        );
        const upper = await manager.applyRequestInterceptors(
          request({ AUTHORIZATION: 'Bearer b' }),
        );

        expect(lower.headers).toEqual({ Accept: 'application/json' });
        expect(upper.headers).toEqual({});
      });

      it('matches a name given in any case', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('X-TENANT');

        const result = await manager.applyRequestInterceptors(
          request({ 'x-tenant': 'tranquility', Accept: '*/*' }),
        );

        expect(result.headers).toEqual({ Accept: '*/*' });
      });

      it('withholds several names, given in one call or across calls', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('Authorization', 'Cookie');
        manager.withholdRequestHeaders('X-Tenant');

        const result = await manager.applyRequestInterceptors(
          request({
            Authorization: 'Bearer a',
            Cookie: 'session=1',
            'X-Tenant': 'tranquility',
            'X-User-Agent': 'app/1.0',
          }),
        );

        expect(result.headers).toEqual({ 'X-User-Agent': 'app/1.0' });
      });

      it('removes a header after every interceptor has run, including one an interceptor added', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('Authorization');
        const seen: (string | undefined)[] = [];
        manager.addRequestInterceptor((ctx) => ({
          ...ctx,
          headers: { ...ctx.headers, Authorization: 'Bearer added' },
        }));
        manager.addRequestInterceptor((ctx) => {
          seen.push(ctx.headers.Authorization);
          return ctx;
        });

        const result = await manager.applyRequestInterceptors(request({}));

        expect(seen).toEqual(['Bearer added']);
        expect(result.headers).toEqual({});
      });

      it('leaves the context it was given unchanged', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('Authorization');
        const original = request({ Authorization: 'Bearer a', Accept: '*/*' });

        const result = await manager.applyRequestInterceptors(original);

        expect(original.headers).toEqual({
          Authorization: 'Bearer a',
          Accept: '*/*',
        });
        expect(result.headers).toEqual({ Accept: '*/*' });
        expect(result.url).toBe(original.url);
      });

      it('survives clear() and adds no interceptor of its own', async () => {
        const manager = new MiddlewareManager();
        manager.withholdRequestHeaders('Authorization');
        expect(manager.hasInterceptors()).toBe(false);

        manager.addRequestInterceptor((ctx) => ctx);
        manager.clear();
        const result = await manager.applyRequestInterceptors(
          request({ Authorization: 'Bearer a' }),
        );

        expect(result.headers).toEqual({});
      });

      it('keeps every header when nothing is withheld', async () => {
        const manager = new MiddlewareManager();
        const original = request({ Authorization: 'Bearer a' });

        const result = await manager.applyRequestInterceptors(original);

        expect(result.headers).toEqual({ Authorization: 'Bearer a' });
      });
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

      // Date is frozen and the response takes exactly 25ms of it to arrive.
      useFakeDate(1_000_000);
      try {
        fetchMock.mockResponseOnce(async () => {
          jest.setSystemTime(Date.now() + 25);
          return JSON.stringify({});
        });

        await handleRequest(client, 'v1/status/', 'GET');
      } finally {
        jest.useRealTimers();
      }

      expect(capturedDuration).toBe(25);
    });

    it('should pass actual HTTP status code to response interceptor', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      let capturedStatus = -1;

      client.addResponseInterceptor((ctx: ResponseContext) => {
        capturedStatus = ctx.status;
        return ctx;
      });

      fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }), {
        status: 200,
      });

      await handleRequest(client, 'v1/status/', 'GET');

      expect(capturedStatus).toBe(200);
    });

    it('should pass 201 status code to response interceptor for created responses', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      let capturedStatus = -1;

      client.addResponseInterceptor((ctx: ResponseContext) => {
        capturedStatus = ctx.status;
        return ctx;
      });

      fetchMock.mockResponseOnce(JSON.stringify({ id: 1 }), {
        status: 201,
      });

      await handleRequest(client, 'v1/characters/1/mail/', 'POST');

      expect(capturedStatus).toBe(201);
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
