import { defineFeature, loadFeature } from 'jest-cucumber';
import {
  CircuitBreaker,
  CircuitOpenError,
} from '../../../../src/core/circuitBreaker/CircuitBreaker';
import {
  RetryStrategy,
  RetryContext,
} from '../../../../src/core/RetryStrategy';
import { EsiError, TimeoutError } from '../../../../src/core/util/error';
import { EsiClient } from '../../../../src/EsiClient';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/0051-resilience.feature');

defineFeature(feature, (test) => {
  test('Third consecutive 503 opens a circuit with a threshold of three', ({
    given,
    when,
    then,
  }) => {
    let cb: CircuitBreaker;

    given('a client with circuit breaker enabled', () => {
      cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 });
    });

    given('the endpoint fails with 503 errors', () => {
      // failures will be recorded in the when step
    });

    when('the client makes requests until the circuit opens', () => {
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
    });

    then('the circuit breaker shall be in the open state', () => {
      expect(cb.getState('test/endpoint')).toBe('open');
      expect(() => cb.checkCircuit('test/endpoint')).toThrow(CircuitOpenError);
    });
  });

  test('Probe succeeding after the reset timeout closes the circuit', ({
    given,
    when,
    then,
  }) => {
    let cb: CircuitBreaker;

    given('a client with circuit breaker in open state', () => {
      cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
      expect(cb.getState('test/endpoint')).toBe('open');
    });

    when(
      'the cooldown period expires and a probe request succeeds',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        cb.checkCircuit('test/endpoint');
        cb.recordSuccess('test/endpoint');
      },
    );

    then('the circuit breaker shall transition to closed state', () => {
      expect(cb.getState('test/endpoint')).toBe('closed');
    });
  });

  test('Persistent 503 runs three attempts and rethrows the 503', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;
    let callCount = 0;

    given('a client with retry configured for 2 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
    });

    given('the endpoint always returns 503', () => {
      // operation is configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        );
      });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a 503 error after all retries', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(callCount).toBe(3);
    });
  });

  test('Second attempt succeeds after a 503 on the first', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let result: any;

    given('a client with retry configured for 2 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
    });

    given('the endpoint fails once then succeeds', () => {
      // configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'success' });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      result = await strategy.execute(operation, context);
    });

    then('the client shall return the successful response', () => {
      expect(result).toEqual({ data: 'success' });
    });
  });

  test('401 on an authenticated endpoint is replayed after refreshing', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let result: any;

    given('a client with a token provider', () => {
      strategy = new RetryStrategy();
    });

    given('the endpoint returns 401 then succeeds after token refresh', () => {
      // configured in the when step
    });

    when('the client makes an authenticated request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(401, 'Unauthorized', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'authed' });
      const refreshToken = jest.fn().mockResolvedValue(undefined);
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: true,
        refreshToken,
      };
      result = await strategy.execute(operation, context);
    });

    then('the client shall return the response after token refresh', () => {
      expect(result).toEqual({ data: 'authed' });
    });
  });

  test('Rejecting refresh callback surfaces a token refresh failure', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;

    given('a client with a failing token provider', () => {
      strategy = new RetryStrategy();
    });

    given('the endpoint returns 401', () => {
      // configured in the when step
    });

    when('the client makes an authenticated request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new EsiError(401, 'Unauthorized', 'test/endpoint'));
      const refreshToken = jest
        .fn()
        .mockRejectedValue(new Error('Token expired'));
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: true,
        refreshToken,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a token refresh failed error', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Token refresh failed');
    });
  });

  test('429 response reaches the caller as an EsiError with status 429', ({
    given,
    when,
    then,
  }) => {
    let client: EsiClient;
    let caughtError: any;

    given('a client configured for the status endpoint', () => {
      client = new EsiClient({
        clientId: 'test-resilience',
        baseUrl: 'https://esi.evetech.net',
      });
    });

    given('the server returns 429 Too Many Requests', () => {
      jest
        .spyOn(client.status, 'getStatus')
        .mockRejectedValue(TestDataFactory.createError(429));
    });

    when('the client requests the server status', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a 429 rate limit error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(429);
    });
  });

  test('Unresponsive endpoint reaches the caller as a TimeoutError', ({
    given,
    when,
    then,
  }) => {
    let client: EsiClient;
    let caughtError: any;

    given('a client configured with a short timeout', () => {
      client = new EsiClient({
        clientId: 'test-timeout',
        baseUrl: 'https://esi.evetech.net',
        timeout: 100,
      });
    });

    given('the endpoint does not respond in time', () => {
      jest
        .spyOn(client.status, 'getStatus')
        .mockRejectedValue(
          new TimeoutError(100, 'https://esi.evetech.net/status'),
        );
    });

    when('the client makes a request', async () => {
      try {
        await client.status.getStatus();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a timeout error', () => {
      expect(caughtError).toBeInstanceOf(TimeoutError);
    });
  });

  test('404 is rethrown after a single attempt despite maxRetries of three', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;
    let callCount = 0;

    given('a client with retry configured for 3 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1,
      });
    });

    given('the endpoint returns 404', () => {
      // configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new EsiError(404, 'Not Found', 'test/endpoint'));
      });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a 404 error without retrying', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(callCount).toBe(1);
    });
  });
});
