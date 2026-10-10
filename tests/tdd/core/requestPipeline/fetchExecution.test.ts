import { executeSingleFetch } from '../../../../src/core/requestPipeline/fetchExecution';
import { ApiClient } from '../../../../src/core/ApiClient';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { ICache } from '../../../../src/core/cache/ICache';
import { IRateLimiter } from '../../../../src/core/rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../../../../src/core/circuitBreaker/ICircuitBreaker';
import {
  EsiConfigurationError,
  EsiError,
  TimeoutError,
} from '../../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('requestPipeline/fetchExecution branch coverage', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;
  const resolveCache = (_c: ApiClient): ICache | null => null;
  const resolveRl = (_c: ApiClient): IRateLimiter => rateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
  });

  describe('transport failures surface as EsiError', () => {
    const resolveCb = (_c: ApiClient): ICircuitBreaker | null => null;
    const run = () =>
      executeSingleFetch(
        client,
        'v1/status/',
        'GET',
        undefined,
        false,
        false,
        resolveCache,
        resolveRl,
        resolveCb,
      );

    it('wraps a rejected fetch in a status-0 EsiError that keeps the cause', async () => {
      const networkErr = new TypeError('fetch failed');
      fetchMock.mockRejectOnce(networkErr);

      const error = await run().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(EsiError);
      expect(error).not.toBeInstanceOf(TimeoutError);
      expect((error as EsiError).statusCode).toBe(0);
      expect((error as EsiError).message).toContain('fetch failed');
      expect((error as EsiError).cause).toBe(networkErr);
    });

    it('rethrows an EsiError the transport rejected with, unchanged', async () => {
      // A transport that speaks the SDK's errors (a test double refusing an
      // unrouted request) is not wrapped as a network failure.
      const thrown = new EsiConfigurationError(
        'CONFIGURATION_ERROR',
        'no route',
      );
      fetchMock.mockRejectOnce(thrown);

      const error = await run().catch((e: unknown) => e);

      expect(error).toBe(thrown);
    });

    it('treats an AbortError that is not an Error instance as a timeout', async () => {
      // DOMException is not instanceof Error in every runtime (Jest's VM
      // context among them), so detection must go by name.
      const abort = {
        name: 'AbortError',
        message: 'The operation was aborted.',
      };
      fetchMock.mockRejectOnce(abort as unknown as Error);

      const error = await run().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TimeoutError);
    });
  });

  describe('redirects are refused, not followed (security model P6)', () => {
    const resolveCb = (_c: ApiClient): ICircuitBreaker | null => null;
    const run = (requiresAuth = false) =>
      executeSingleFetch(
        client,
        'characters/1/wallet/',
        'GET',
        undefined,
        requiresAuth,
        false,
        resolveCache,
        resolveRl,
        resolveCb,
      );

    it('asks fetch not to follow redirects', async () => {
      const seen: RequestInit[] = [];
      client.setFetch(async (_url, init) => {
        seen.push(init ?? {});
        return new Response('[]', { status: 200 });
      });

      await run();

      expect(seen[0]?.redirect).toBe('manual');
    });

    it.each([300, 301, 302, 303, 307, 308, 399])(
      'rejects a %d naming only the target origin, never its path or query',
      async (status) => {
        client.setFetch(
          async () =>
            new Response(null, {
              status,
              headers: {
                location: 'https://attacker.example/steal?token=secret',
              },
            }),
        );

        const error = await run().catch((e: unknown) => e);

        expect(error).toBeInstanceOf(EsiError);
        expect((error as EsiError).statusCode).toBe(status);
        expect((error as EsiError).retryable).toBe(false);
        expect((error as EsiError).message).toBe(
          `Redirect refused: ESI answered ${status} with a redirect to https://attacker.example, and the client does not follow redirects`,
        );
      },
    );

    it('resolves a relative Location against the request URL', async () => {
      client.setFetch(
        async () =>
          new Response(null, { status: 302, headers: { location: '/other' } }),
      );

      const error = (await run().catch((e: unknown) => e)) as EsiError;

      expect(error.message).toContain('a redirect to https://esi.evetech.net,');
    });

    it('says so when the Location cannot be parsed', async () => {
      client.setFetch(
        async () =>
          new Response(null, {
            status: 302,
            headers: { location: 'http://[bad' },
          }),
      );

      const error = (await run().catch((e: unknown) => e)) as EsiError;

      expect(error.message).toContain('a redirect to an unparsable location');
    });

    it('reports an opaque redirect, whose status the runtime hides, as a 302', async () => {
      const opaque = new Response(null, { status: 200 });
      Object.defineProperty(opaque, 'type', { value: 'opaqueredirect' });
      Object.defineProperty(opaque, 'status', { value: 0 });
      client.setFetch(async () => opaque);

      const error = (await run().catch((e: unknown) => e)) as EsiError;

      expect(error.statusCode).toBe(302);
      expect(error.message).toContain(
        'a redirect to a location the runtime did not disclose',
      );
    });

    it.each([299, 304, 400])(
      'does not treat a %d as a redirect',
      async (status) => {
        client.setFetch(async () => new Response(null, { status }));

        const result = await run();

        expect(result.response.status).toBe(status);
      },
    );
  });

  describe('finally records failure when cb exists but no path recorded', () => {
    it('should record failure in finally when rate limiter throws before fetch', async () => {
      const recordFailureMock = jest.fn();
      const mockCb: ICircuitBreaker = {
        checkCircuit: jest.fn(),
        recordSuccess: jest.fn(),
        recordFailure: recordFailureMock,
        getState: jest.fn().mockReturnValue('closed'),
        getStats: jest.fn().mockReturnValue({}),
        shutdown: jest.fn(),
        reset: jest.fn(),
        cleanup: jest.fn().mockReturnValue(0),
      };

      const resolveCb = (_c: ApiClient): ICircuitBreaker | null => mockCb;
      const throwingRl: IRateLimiter = {
        checkRateLimit: jest
          .fn()
          .mockRejectedValue(new Error('rate limit error')),
        updateFromResponse: jest.fn(),
        getStatus: jest.fn().mockReturnValue({
          remaining: 100,
          limit: 100,
          used: 0,
          group: null,
          errorLimitRemain: 100,
          errorLimitReset: 0,
          retryAfter: null,
          blockedUntil: 0,
        }),
        isBlocked: jest.fn().mockReturnValue(false),
        reset: jest.fn(),
        getGroupStatus: jest.fn(),
        getAllGroupStatuses: jest.fn().mockReturnValue(new Map()),
      };
      const resolveThrowingRl = (_c: ApiClient): IRateLimiter => throwingRl;

      await expect(
        executeSingleFetch(
          client,
          'v1/status/',
          'GET',
          undefined,
          false,
          false,
          resolveCache,
          resolveThrowingRl,
          resolveCb,
        ),
      ).rejects.toThrow('rate limit error');

      expect(recordFailureMock).toHaveBeenCalledWith('v1/status/', 0);
    });
  });

  describe('circuit breaker with template key strategy', () => {
    it('should use templatePath as cbKey when cb.getKeyStrategy returns template', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }));
      const recordSuccessMock = jest.fn();
      const mockCb: ICircuitBreaker = {
        checkCircuit: jest.fn(),
        recordSuccess: recordSuccessMock,
        recordFailure: jest.fn(),
        getState: jest.fn().mockReturnValue('closed'),
        getStats: jest.fn().mockReturnValue({}),
        shutdown: jest.fn(),
        reset: jest.fn(),
        cleanup: jest.fn().mockReturnValue(0),
        getKeyStrategy: jest.fn().mockReturnValue('template'),
      };

      const resolveCb = (_c: ApiClient): ICircuitBreaker | null => mockCb;

      await executeSingleFetch(
        client,
        'v1/characters/123/assets/',
        'GET',
        undefined,
        false,
        false,
        resolveCache,
        resolveRl,
        resolveCb,
        undefined,
        'characters/{characterId}/assets',
      );

      expect(recordSuccessMock).toHaveBeenCalledWith(
        'characters/{characterId}/assets',
      );
    });
  });
});
