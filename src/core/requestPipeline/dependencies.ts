import { ApiClient } from '../ApiClient';
import { EsiConfigurationError } from '../util/error';
import { ICache } from '../cache/ICache';
import { IRateLimiter } from '../rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../circuitBreaker/ICircuitBreaker';
import { IRetryStrategy } from '../IRetryStrategy';
import { RetryStrategy } from '../RetryStrategy';

export function resolveCache(client: ApiClient): ICache | null {
  return client.getCache();
}

export function resolveRateLimiter(client: ApiClient): IRateLimiter {
  const limiter = client.getRateLimiter();
  if (!limiter) {
    throw new EsiConfigurationError(
      'CONFIGURATION_ERROR',
      'No rate limiter configured on ApiClient. ' +
        'Set one via apiClient.setRateLimiter(new RateLimiter()).',
    );
  }
  return limiter;
}

export function resolveCircuitBreaker(
  client: ApiClient,
): ICircuitBreaker | null {
  return client.getCircuitBreaker();
}

export function resolveRetryStrategy(client: ApiClient): IRetryStrategy {
  return (
    client.getRetryStrategy() ??
    new RetryStrategy(client.getRetryConfig() ?? undefined)
  );
}
