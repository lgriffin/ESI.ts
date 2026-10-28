/**
 * What `EsiClient`, `CustomEsiClient` and `EsiApiFactory` are built from.
 * Lives in core so `configureApiClient` can take it without importing an
 * entry point (the layer rule in config/eslint/layers.rules.cjs). Re-exported from
 * `EsiClient.ts` and the root entry under the same names.
 */
import type { TokenProvider } from './ApiClient';
import type {
  RequestInterceptor,
  ResponseInterceptor,
} from './middleware/Middleware';
import type { ETagCacheConfig } from './cache/ETagCacheManager';
import type { CircuitBreakerConfig } from './circuitBreaker/CircuitBreaker';
import type { RateLimiterConfig } from './rateLimiter/RateLimiter';
import type { RetryConfig } from './util/retry';
import type { IRetryStrategy } from './IRetryStrategy';
import type { ILogger } from './logger/ILogger';
import type { LogLevel } from './logger/DefaultLogger';
import type { IncompletePagesMode } from './pagination/pageLimit';
import type { CacheStore } from './ports/CacheStore';
import type { Clock } from './ports/Clock';
import type { HttpTransport } from './ports/HttpTransport';
import type { ICircuitBreaker } from './circuitBreaker/ICircuitBreaker';
import type { IDeduplicator } from './IDeduplicator';
import type { IRateLimiter } from './rateLimiter/IRateLimiter';

export type EsiDatasource = 'tranquility' | 'singularity';

export interface EsiClientConfig {
  clientId?: string | undefined;
  baseUrl?: string | undefined;
  accessToken?: string | undefined;
  datasource?: EsiDatasource | undefined;
  onTokenRefresh?: TokenProvider | undefined;
  timeout?: number | undefined;
  retryAttempts?: number | undefined;
  retryConfig?: RetryConfig | undefined;
  retryStrategy?: IRetryStrategy | undefined;
  enableETagCache?: boolean | undefined;
  etagCacheConfig?: ETagCacheConfig | undefined;
  enableCircuitBreaker?: boolean | undefined;
  circuitBreakerConfig?: CircuitBreakerConfig | undefined;
  unsafeAllowCustomHost?: boolean | undefined;
  enableRequestDeduplication?: boolean | undefined;
  language?: string | undefined;
  compatibilityDate?: string | undefined;
  /**
   * The ESI tenant every request names in `X-Tenant` (`tranquility`,
   * `singularity`). Unset, no header is sent and ESI serves Tranquility.
   */
  tenant?: string | undefined;
  /**
   * Who is calling, for CCP to contact: an application name, version and
   * contact address. Sent as `X-User-Agent` (in place of `clientId`) and at the
   * start of `User-Agent`, before the library's own identifier.
   */
  userAgent?: string | undefined;
  rateLimiterConfig?: RateLimiterConfig | undefined;
  requestInterceptors?: RequestInterceptor[] | undefined;
  responseInterceptors?: ResponseInterceptor[] | undefined;
  validateResponse?: boolean | undefined;
  validateRequest?: boolean | undefined;
  /**
   * What pagination does when it cannot prove a walk complete (a page count
   * above 1000, an empty page after the first, a cursor still set at the page
   * limit). `'truncate'`, the default, returns the pages fetched so far and
   * logs a warning; `'throw'` rejects with an `EsiPaginationError` carrying
   * the reason and the partial result. The default becomes `'throw'` in a
   * future major. See guides/PAGINATION.md.
   */
  incompletePages?: IncompletePagesMode | undefined;
  /** Custom logger for this client. Falls back to the global logger, then pino. */
  logger?: ILogger | undefined;
  /**
   * Log level for the default pino logger
   * (`fatal|error|warn|info|debug|trace`, or `silent` to turn it off).
   * Overrides `ESI_LOG_LEVEL`.
   */
  logLevel?: LogLevel | 'silent' | undefined;
  /**
   * Where the conditional-request cache keeps bodies and ETags, in place of
   * the in-memory cache `etagCacheConfig` configures: a shared store (Redis,
   * a file) implementing the `CacheStore` port, or an `ICache` such as an
   * `ETagCacheManager`. Ignored when `enableETagCache` is `false`. The client
   * does not shut it down; its owner does.
   */
  cache?: CacheStore | undefined;
  /** The rate limiter every request draws on, in place of the one `rateLimiterConfig` builds. */
  rateLimiter?: IRateLimiter | undefined;
  /**
   * The circuit breaker every request goes through, in place of the one
   * `circuitBreakerConfig` builds. Supplying one turns the breaker on. The
   * client does not shut it down; its owner does.
   */
  circuitBreaker?: ICircuitBreaker | undefined;
  /**
   * The in-flight table identical GETs join. Supplying one turns
   * deduplication on, whatever `enableRequestDeduplication` says. The client
   * does not clear it on shutdown; its owner does.
   */
  deduplicator?: IDeduplicator | undefined;
  /**
   * Where the pipeline reads time and waits: cache entry age, retry back-off,
   * the rate limiter's windows and waits, the circuit breaker's reset timeout
   * and response times. Defaults to the wall clock and real timers. The
   * cleanup timers and the request timeout always run on real time, and a
   * supplied middleware instance keeps whatever clock it was built with.
   */
  clock?: Clock | undefined;
  /**
   * Sends each HTTP request, in place of `globalThis.fetch`: a proxy agent, a
   * recording transport, or `createMockTransport()` from
   * `@lgriffin/esi.ts/testing` for an application's own tests. Everything
   * between a domain-client call and the transport is the real pipeline.
   * Identity views from `as(identity)` send through it too.
   */
  transport?: HttpTransport | undefined;
}
