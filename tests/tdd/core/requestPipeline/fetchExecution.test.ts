import { executeSingleFetch } from '../../../../src/core/requestPipeline/fetchExecution';
import { ApiClient } from '../../../../src/core/ApiClient';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { ICache } from '../../../../src/core/cache/ICache';
import { IRateLimiter } from '../../../../src/core/rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../../../../src/core/circuitBreaker/ICircuitBreaker';
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

  describe('fetch throws non-AbortError without circuit breaker', () => {
    it('should re-throw the error when no circuit breaker is present', async () => {
      const networkErr = new Error('ECONNREFUSED');
      fetchMock.mockRejectOnce(networkErr);

      const resolveCb = (_c: ApiClient): ICircuitBreaker | null => null;

      await expect(
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
        ),
      ).rejects.toThrow('ECONNREFUSED');
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
