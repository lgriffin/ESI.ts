import { RetryStrategy, RetryContext } from '../../../src/core/RetryStrategy';
import { EsiError } from '../../../src/core/util/error';
import { CircuitOpenError } from '../../../src/core/circuitBreaker/CircuitBreaker';
import { ApiClient } from '../../../src/core/ApiClient';
import { configureApiClient } from '../../../src/core/configureApiClient';

describe('RetryStrategy', () => {
  const baseContext: RetryContext = {
    endpoint: 'test/endpoint',
    method: 'GET',
    requiresAuth: false,
    retryOperation: jest.fn(),
  };

  describe('no retries configured', () => {
    it('should execute operation once and return result', async () => {
      const strategy = new RetryStrategy();
      const operation = jest.fn().mockResolvedValue({ data: 'success' });

      const result = await strategy.execute(operation, baseContext);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw on first error', async () => {
      const strategy = new RetryStrategy();
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('network failure'));

      await expect(strategy.execute(operation, baseContext)).rejects.toThrow(
        'network failure',
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('with retries', () => {
    it('should retry on retryable EsiError', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'recovered' });

      const result = await strategy.execute(operation, baseContext);

      expect(result).toEqual({ data: 'recovered' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exhausted', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
      const error = new EsiError(503, 'Service Unavailable', 'test/endpoint');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(strategy.execute(operation, baseContext)).rejects.toThrow(
        'Service Unavailable',
      );
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1,
      });
      const error = new EsiError(404, 'Not Found', 'test/endpoint');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(strategy.execute(operation, baseContext)).rejects.toThrow(
        'Not Found',
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry mutations by default', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1,
      });
      const error = new EsiError(503, 'Service Unavailable', 'test/endpoint');
      const operation = jest.fn().mockRejectedValue(error);
      const context = { ...baseContext, method: 'POST' };

      await expect(strategy.execute(operation, context)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry mutations when retryMutations is true', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 1,
        baseDelayMs: 1,
        retryMutations: true,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'ok' });
      const context = { ...baseContext, method: 'POST' };

      const result = await strategy.execute(operation, context);

      expect(result).toEqual({ data: 'ok' });
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('circuit breaker integration', () => {
    it('should immediately throw CircuitOpenError without retry', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1,
      });
      const error = new CircuitOpenError('test/endpoint', 5, 30000);
      const operation = jest.fn().mockRejectedValue(error);

      await expect(strategy.execute(operation, baseContext)).rejects.toThrow(
        CircuitOpenError,
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('token refresh', () => {
    it('should refresh token on 401 and retry', async () => {
      const strategy = new RetryStrategy();
      const refreshToken = jest.fn().mockResolvedValue(undefined);
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(401, 'Unauthorized', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'authed' });
      const context: RetryContext = {
        ...baseContext,
        requiresAuth: true,
        refreshToken,
      };

      const result = await strategy.execute(operation, context);

      expect(refreshToken).toHaveBeenCalledTimes(1);
      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'authed' });
    });

    it('should propagate CircuitOpenError from post-refresh request', async () => {
      const strategy = new RetryStrategy();
      const refreshToken = jest.fn().mockResolvedValue(undefined);
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(401, 'Unauthorized', 'test/endpoint'),
        )
        .mockRejectedValueOnce(new CircuitOpenError('test/endpoint', 5, 30000));
      const context: RetryContext = {
        ...baseContext,
        requiresAuth: true,
        refreshToken,
      };

      await expect(strategy.execute(operation, context)).rejects.toBeInstanceOf(
        CircuitOpenError,
      );
    });

    it('should throw TOKEN_REFRESH_FAILED when refresh fails', async () => {
      const strategy = new RetryStrategy();
      const refreshToken = jest
        .fn()
        .mockRejectedValue(new Error('refresh error'));
      const operation = jest
        .fn()
        .mockRejectedValue(new EsiError(401, 'Unauthorized', 'test/endpoint'));
      const context: RetryContext = {
        ...baseContext,
        requiresAuth: true,
        refreshToken,
        retryOperation: jest.fn(),
      };

      await expect(strategy.execute(operation, context)).rejects.toThrow(
        'Token refresh failed',
      );
    });

    it('should not attempt refresh without token provider', async () => {
      const strategy = new RetryStrategy();
      const operation = jest
        .fn()
        .mockRejectedValue(new EsiError(401, 'Unauthorized', 'test/endpoint'));
      const context: RetryContext = {
        ...baseContext,
        requiresAuth: true,
      };

      await expect(strategy.execute(operation, context)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });

  describe('configureApiClient default retry', () => {
    it('should set default retry config with 3 retries when none specified', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      configureApiClient(client);

      const retryConfig = client.getRetryConfig();
      expect(retryConfig).not.toBeNull();
      expect(retryConfig?.maxRetries).toBe(3);
      expect(retryConfig?.baseDelayMs).toBe(1000);
      expect(retryConfig?.maxDelayMs).toBe(30000);
    });

    it('should use explicit retryConfig when provided', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      configureApiClient(client, {
        retryConfig: { maxRetries: 5, baseDelayMs: 500 },
      });

      const retryConfig = client.getRetryConfig();
      expect(retryConfig?.maxRetries).toBe(5);
      expect(retryConfig?.baseDelayMs).toBe(500);
    });

    it('should use retryAttempts when provided for backward compatibility', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      configureApiClient(client, { retryAttempts: 2 });

      const retryConfig = client.getRetryConfig();
      expect(retryConfig?.maxRetries).toBe(2);
    });

    it('should allow disabling retries via retryAttempts: 0', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      configureApiClient(client, { retryAttempts: 0 });

      const retryConfig = client.getRetryConfig();
      expect(retryConfig?.maxRetries).toBe(0);
    });
  });
});
