import { executeSingleFetch } from '../../../../src/core/requestPipeline/fetchExecution';
import { ApiClient } from '../../../../src/core/ApiClient';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { ICache } from '../../../../src/core/cache/ICache';
import { IRateLimiter } from '../../../../src/core/rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../../../../src/core/circuitBreaker/ICircuitBreaker';
import { EsiError, TimeoutError } from '../../../../src/core/util/error';
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
