import { ApiClient } from './ApiClient';
import { ETagCacheManager } from './cache/ETagCacheManager';
import { CircuitBreaker } from './circuitBreaker/CircuitBreaker';
import { RateLimiter } from './rateLimiter/RateLimiter';
import { RequestDeduplicator } from './RequestDeduplicator';
import { createDefaultLogger } from './logger/DefaultLogger';
import type { EsiClientConfig } from './EsiClientConfig';
import { cacheFromStore } from './cache/CacheStoreCache';

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
 *
 * Middleware the config supplies as instances (`cache`, `rateLimiter`,
 * `circuitBreaker`, `deduplicator`) is installed in place of what the config
 * would build: a supplied circuit breaker or deduplicator even when the
 * config leaves that stage off, a supplied cache unless the config turns the
 * ETag cache off. A supplied `clock` goes on the client and into every stage
 * built here. The returned deduplicator is only one built here.
 */
export function configureApiClient(
  client: ApiClient,
  config?: EsiClientConfig,
): ConfigureApiClientResult {
  if (config?.clock) client.setClock(config.clock);

  // Per-client logger first, so the middleware built below (the ETag
  // cache's startup line included) logs to it from the start.
  // Only when explicitly configured. Otherwise the pipeline
  // resolves to the global setLogger() logger, then the built-in pino default
  // (level from ESI_LOG_LEVEL), so existing global-logger setups keep working.
  if (config?.logger) {
    client.setLogger(config.logger);
  } else if (config?.logLevel) {
    client.setLogger(createDefaultLogger(config.logLevel));
  }

  // Per-client identity headers. The setters refuse a value that is not a
  // valid header, so a bad one fails here rather than on every request.
  if (config?.tenant !== undefined) client.setTenant(config.tenant);
  if (config?.userAgent !== undefined) client.setUserAgent(config.userAgent);

  const deduplicator = installMiddleware(client, config);

  // Retry config — default to 3 retries with exponential backoff so that
  // transient ESI failures (502/503/504) are handled automatically.
  if (config?.retryConfig) {
    client.setRetryConfig(config.retryConfig);
  } else if (config?.retryAttempts !== undefined) {
    client.setRetryConfig({ maxRetries: config.retryAttempts });
  } else {
    client.setRetryConfig({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    });
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

  applyPipelineOptions(client, config);

  return { deduplicator };
}

/**
 * The plain per-client switches: response and request validation, what
 * pagination does with an incomplete walk, and the timeout. Each is set only
 * when the config names it, so the ApiClient's own default stands otherwise.
 */
function applyPipelineOptions(
  client: ApiClient,
  config: EsiClientConfig | undefined,
): void {
  // Validate response
  if (config?.validateResponse !== undefined) {
    client.setValidateResponse(config.validateResponse);
  }

  // Validate request (opt-in, default false)
  if (config?.validateRequest !== undefined) {
    client.setValidateRequest(config.validateRequest);
  }

  // Incomplete pagination (truncate by default, throw opt-in)
  if (config?.incompletePages !== undefined) {
    client.setIncompletePages(config.incompletePages);
  }

  // Timeout
  if (config?.timeout !== undefined) {
    client.setTimeout(config.timeout);
  }
}

/**
 * Installs the rate limiter, deduplicator, ETag cache and circuit breaker:
 * each one supplied in the config, or built from it on the supplied clock.
 * Returns the deduplicator it built, if any.
 */
function installMiddleware(
  client: ApiClient,
  config: EsiClientConfig | undefined,
): RequestDeduplicator | null {
  const clock = config?.clock;
  let deduplicator: RequestDeduplicator | null = null;

  // Rate limiter (always)
  if (config?.rateLimiter) {
    client.setRateLimiter(config.rateLimiter);
  } else {
    const rateLimiter = new RateLimiter(config?.rateLimiterConfig, clock);
    rateLimiter.setClient(client);
    client.setRateLimiter(rateLimiter);
  }

  // Request deduplication (on by default)
  if (config?.deduplicator) {
    client.setDeduplicator(config.deduplicator);
  } else if (config?.enableRequestDeduplication !== false) {
    deduplicator = new RequestDeduplicator();
    deduplicator.setClient(client);
    client.setDeduplicator(deduplicator);
  }

  // ETag cache (on by default)
  if (config?.enableETagCache !== false) {
    const cache = config?.cache
      ? cacheFromStore(config.cache)
      : new ETagCacheManager(config?.etagCacheConfig, client, clock);
    client.setCache(cache);
  }

  // Circuit breaker (off by default, opt-in)
  if (config?.circuitBreaker) {
    client.setCircuitBreaker(config.circuitBreaker);
  } else if (config?.enableCircuitBreaker) {
    const cb = new CircuitBreaker(config.circuitBreakerConfig, clock);
    cb.setClient(client);
    client.setCircuitBreaker(cb);
  }

  return deduplicator;
}
