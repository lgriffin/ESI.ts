import { ApiClient } from './ApiClient';
import { ETagCacheManager } from './cache/ETagCacheManager';
import { CircuitBreaker } from './circuitBreaker/CircuitBreaker';
import { RateLimiter } from './rateLimiter/RateLimiter';
import { RequestDeduplicator } from './RequestDeduplicator';
import type { EsiClientConfig } from '../EsiClient';

export interface ConfigureApiClientResult {
  deduplicator: RequestDeduplicator | null;
}

/**
 * Configures an existing ApiClient with the full middleware stack
 * based on an EsiClientConfig. This is the single source of truth
 * for how config maps to middleware — used by EsiClient,
 * CustomEsiClient, and EsiApiFactory.
 *
 * The caller is responsible for creating the ApiClient (with baseUrl,
 * clientId, accessToken) and setting datasource/language/tokenProvider
 * before calling this function, since those vary by construction surface.
 */
export function configureApiClient(
  client: ApiClient,
  config?: EsiClientConfig,
): ConfigureApiClientResult {
  let deduplicator: RequestDeduplicator | null = null;

  // Rate limiter (always)
  client.setRateLimiter(new RateLimiter(config?.rateLimiterConfig));

  // Request deduplication (on by default)
  if (config?.enableRequestDeduplication !== false) {
    deduplicator = new RequestDeduplicator();
    client.setDeduplicator(deduplicator);
  }

  // ETag cache (on by default)
  if (config?.enableETagCache !== false) {
    client.setCache(new ETagCacheManager(config?.etagCacheConfig));
  }

  // Circuit breaker (off by default, opt-in)
  if (config?.enableCircuitBreaker) {
    client.setCircuitBreaker(new CircuitBreaker(config.circuitBreakerConfig));
  }

  // Retry config
  if (config?.retryConfig) {
    client.setRetryConfig(config.retryConfig);
  } else if (config?.retryAttempts !== undefined) {
    client.setRetryConfig({ maxRetries: config.retryAttempts });
  }

  // Retry strategy
  if (config?.retryStrategy) {
    client.setRetryStrategy(config.retryStrategy);
  }

  // Interceptors
  if (config?.requestInterceptors) {
    for (const interceptor of config.requestInterceptors) {
      client.addRequestInterceptor(interceptor);
    }
  }
  if (config?.responseInterceptors) {
    for (const interceptor of config.responseInterceptors) {
      client.addResponseInterceptor(interceptor);
    }
  }

  // Validate response
  if (config?.validateResponse !== undefined) {
    client.setValidateResponse(config.validateResponse);
  }

  // Validate request (opt-in, default false)
  if (config?.validateRequest !== undefined) {
    client.setValidateRequest(config.validateRequest);
  }

  // Timeout
  if (config?.timeout !== undefined) {
    client.setTimeout(config.timeout);
  }

  return { deduplicator };
}
