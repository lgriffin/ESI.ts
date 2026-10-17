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
}
