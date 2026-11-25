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
  /**
   * Identifies the application to CCP when `userAgent` is unset: sent as
   * `X-User-Agent`. Defaults to `ESI_CLIENT_ID`, then a name for the
   * construction surface: `'esi-client'` for `EsiClient`, `'esi-custom-client'`
   * for `EsiClientBuilder` and `'esi-standalone-client'` for a standalone
   * domain client. Prefer `userAgent`, which also names a contact address.
   */
  clientId?: string | undefined;
  /**
   * Where requests go. Defaults to `ESI_BASE_URL`, then
   * `https://esi.evetech.net`. Construction fails unless it is HTTPS on an
   * allowlisted host; `unsafeAllowCustomHost` lifts the host check.
   */
  baseUrl?: string | undefined;
  /**
   * An EVE SSO access token. Defaults to `ESI_ACCESS_TOKEN`. It is attached
   * only to calls whose endpoint declares a scope; public calls never carry
   * it. See `onTokenRefresh` for refresh, and `as(identity)` for many
   * characters.
   */
  accessToken?: string | undefined;
  /**
   * The legacy `datasource` query parameter. Defaults to `ESI_DATASOURCE`,
   * else none. Prefer `tenant`, the header ESI reads today.
   */
  datasource?: EsiDatasource | undefined;
  /**
   * Called once when an authenticated request is answered 401; the request
   * is then retried with the token it resolves to. Concurrent 401s share one
   * call. A rejection surfaces as `EsiTokenRefreshError`.
   */
  onTokenRefresh?: TokenProvider | undefined;
  /** Per-request timeout in milliseconds, reading the body included. Default 30000. */
  timeout?: number | undefined;
  /**
   * How many times a transient failure is retried. Default 3. A
   * `retryConfig` that names `maxRetries` overrides it.
   */
  retryAttempts?: number | undefined;
  /**
   * How transient failures (network errors, 420, 429, 502, 503, 504) are
   * retried: `maxRetries`, `baseDelayMs` (1000, with jitter), `maxDelayMs`
   * (30000) and `retryMutations` (false: only GETs retry). Left out,
   * `maxRetries` falls back to `retryAttempts`, then 3.
   */
  retryConfig?: RetryConfig | undefined;
  /** Replaces the retry strategy `retryConfig` configures. */
  retryStrategy?: IRetryStrategy | undefined;
  /**
   * The spec-TTL and ETag cache: a GET inside ESI's cache window makes no
   * HTTP call, and an older entry is revalidated with `If-None-Match`.
   * Default true.
   */
  enableETagCache?: boolean | undefined;
  /** Size, fallback TTL and sweep interval of the built-in cache. */
  etagCacheConfig?: ETagCacheConfig | undefined;
  /**
   * Turns on the per-endpoint circuit breaker. Default false, so
   * `circuitBreakerConfig` is ignored unless this is true or a
   * `circuitBreaker` is supplied.
   */
  enableCircuitBreaker?: boolean | undefined;
  /** Thresholds, timeouts and key strategy of the built-in circuit breaker. */
  circuitBreakerConfig?: CircuitBreakerConfig | undefined;
  /**
   * Allows a `baseUrl` outside the host allowlist (a local mock or a
   * proxy). HTTPS is still required. Default false.
   */
  unsafeAllowCustomHost?: boolean | undefined;
  /** Coalesces identical in-flight GETs into one request. Default true. */
  enableRequestDeduplication?: boolean | undefined;
  /** Sent as `Accept-Language`: en, de, fr, ja, ru, zh, ko or es. Default none. */
  language?: string | undefined;
  /**
   * Sent as `X-Compatibility-Date`, the ESI contract date the response
   * shapes follow. Defaults to the library's `COMPATIBILITY_DATE`; a
   * different date can change shapes the schemas expect.
   */
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
  /** Tuning for the built-in per-group rate limiter (the limiter is always on). */
  rateLimiterConfig?: RateLimiterConfig | undefined;
  /** Run before each request is sent, in order; each may change the request. */
  requestInterceptors?: RequestInterceptor[] | undefined;
  /** Run on each response before it is validated, in order. */
  responseInterceptors?: ResponseInterceptor[] | undefined;
  /**
   * Validates every response that has a schema with Zod; a mismatch throws
   * `EsiValidationError`. Default true.
   */
  validateResponse?: boolean | undefined;
  /** Validates request bodies with Zod before sending. Default false. */
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
