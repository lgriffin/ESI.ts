import { ApiClient } from '../../../src/core/ApiClient';
import { IRetryStrategy } from '../../../src/core/IRetryStrategy';
import { RetryStrategy, RetryContext } from '../../../src/core/RetryStrategy';

describe('IRetryStrategy', () => {
  describe('ApiClient getter/setter', () => {
    it('should return null when no retry strategy is set', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      expect(client.getRetryStrategy()).toBeNull();
    });

    it('should return the injected retry strategy', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      const custom: IRetryStrategy = {
        execute: jest.fn().mockResolvedValue('custom-result'),
      };

      client.setRetryStrategy(custom);

      expect(client.getRetryStrategy()).toBe(custom);
    });

    it('should allow clearing the retry strategy with null', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      const custom: IRetryStrategy = {
        execute: jest.fn().mockResolvedValue('custom-result'),
      };

      client.setRetryStrategy(custom);
      expect(client.getRetryStrategy()).toBe(custom);

      client.setRetryStrategy(null);
      expect(client.getRetryStrategy()).toBeNull();
    });
  });

  describe('RetryStrategy implements IRetryStrategy', () => {
    it('should satisfy the IRetryStrategy interface', () => {
      const strategy: IRetryStrategy = new RetryStrategy();
      expect(strategy.execute).toBeDefined();
      expect(typeof strategy.execute).toBe('function');
    });

    it('should work when typed as IRetryStrategy', async () => {
      const strategy: IRetryStrategy = new RetryStrategy();
      const operation = jest.fn().mockResolvedValue({ data: 'ok' });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
      };

      const result = await strategy.execute(operation, context);

      expect(result).toEqual({ data: 'ok' });
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom IRetryStrategy implementation', () => {
    it('should invoke custom strategy when set on ApiClient', async () => {
      const executeMock = jest.fn().mockResolvedValue({ data: 'custom' });
      const custom: IRetryStrategy = { execute: executeMock };
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRetryStrategy(custom);

      const strategy = client.getRetryStrategy()!;
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
      };

      const result = await strategy.execute(
        () => Promise.resolve({ data: 'original' }),
        context,
      );

      expect(result).toEqual({ data: 'custom' });
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it('should pass operation and context to custom strategy', async () => {
      const executeMock = jest
        .fn()
        .mockImplementation(
          async <T>(op: () => Promise<T>, _ctx: RetryContext) => {
            return op();
          },
        );
      const custom: IRetryStrategy = { execute: executeMock };
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRetryStrategy(custom);

      const strategy = client.getRetryStrategy()!;
      const operation = jest.fn().mockResolvedValue({ data: 'passthrough' });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'POST',
        requiresAuth: true,
      };

      const result = await strategy.execute(operation, context);

      expect(result).toEqual({ data: 'passthrough' });
      expect(executeMock).toHaveBeenCalledWith(operation, context);
    });
  });

  describe('retryConfig backwards compatibility', () => {
    it('should still accept retryConfig when no retryStrategy is set', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRetryConfig({ maxRetries: 3, baseDelayMs: 100 });

      expect(client.getRetryConfig()).toEqual({
        maxRetries: 3,
        baseDelayMs: 100,
      });
      expect(client.getRetryStrategy()).toBeNull();
    });

    it('should allow both retryConfig and retryStrategy to coexist', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      const custom: IRetryStrategy = {
        execute: jest.fn().mockResolvedValue('custom'),
      };

      client.setRetryConfig({ maxRetries: 3 });
      client.setRetryStrategy(custom);

      expect(client.getRetryConfig()).toEqual({ maxRetries: 3 });
      expect(client.getRetryStrategy()).toBe(custom);
    });
  });
});
