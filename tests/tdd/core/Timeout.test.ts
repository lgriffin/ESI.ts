import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import {
  EsiError,
  TimeoutError,
  isTimeout,
} from '../../../src/core/util/error';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('TimeoutError', () => {
  it('extends EsiError', () => {
    const err = new TimeoutError(5000, 'https://esi.test/v1/status/');
    expect(err).toBeInstanceOf(EsiError);
    expect(err).toBeInstanceOf(TimeoutError);
    expect(err).toBeInstanceOf(Error);
  });

  it('has statusCode 0', () => {
    const err = new TimeoutError(5000);
    expect(err.statusCode).toBe(0);
  });

  it('stores timeoutMs', () => {
    const err = new TimeoutError(15000, 'https://esi.test/v1/status/');
    expect(err.timeoutMs).toBe(15000);
  });

  it('has descriptive message', () => {
    const err = new TimeoutError(30000);
    expect(err.message).toBe('Request timed out after 30000ms');
  });

  it('is retryable', () => {
    const err = new TimeoutError(5000);
    expect(err.retryable).toBe(true);
  });

  it('isTimeout() returns true for TimeoutError', () => {
    const err = new TimeoutError(5000);
    expect(isTimeout(err)).toBe(true);
  });

  it('isTimeout() returns false for EsiError with statusCode 0', () => {
    const err = new EsiError(0, 'generic timeout');
    expect(isTimeout(err)).toBe(false);
  });

  it('EsiError.isTimeout() still works for statusCode 0', () => {
    const timeout = new TimeoutError(5000);
    const generic = new EsiError(0, 'generic');
    expect(timeout.isTimeout()).toBe(true);
    expect(generic.isTimeout()).toBe(true);
  });
});

describe('Timeout in request handler', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  it('throws TimeoutError on timeout', async () => {
    client.setTimeout(10);

    fetchMock.mockRejectOnce(
      Object.assign(new Error('The operation was aborted.'), {
        name: 'AbortError',
      }),
    );

    try {
      await handleRequest(client, 'v1/status/', 'GET');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
      expect((e as TimeoutError).timeoutMs).toBe(10);
    }
  });

  it('per-request timeout overrides client timeout', async () => {
    client.setTimeout(60000);

    fetchMock.mockRejectOnce(
      Object.assign(new Error('The operation was aborted.'), {
        name: 'AbortError',
      }),
    );

    try {
      await handleRequest(
        client,
        'v1/status/',
        'GET',
        undefined,
        false,
        true,
        undefined,
        10,
      );
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
      expect((e as TimeoutError).timeoutMs).toBe(10);
    }
  });
});
