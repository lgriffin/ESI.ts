/**
 * The root entry's deprecated names for pipeline pieces that exist only for
 * the legacy construction tree (guides/LEGACY-REMOVAL.md). Each alias here is
 * what `src/index.ts` exports; the declaration it points at stays untagged,
 * because `createEsi` (src/client/runtime.ts) and the request pipeline still
 * use it internally. 13.0.0 removes these names from the root entry.
 *
 * A class is aliased as a value and a type of the same name, so `new`,
 * `instanceof`, `extends` and type positions keep working until then.
 */
import { batchFetch as coreBatchFetch } from './core/BatchRequestHandler';
import { batchPost as coreBatchPost } from './core/BatchRequestHandler';
import type {
  BatchOptions as CoreBatchOptions,
  BatchResult as CoreBatchResult,
} from './core/BatchRequestHandler';
import { ApiClient as CoreApiClient } from './core/ApiClient';
import { configureApiClient as coreConfigureApiClient } from './core/configureApiClient';
import type { ConfigureApiClientResult as CoreConfigureApiClientResult } from './core/configureApiClient';
import type { EsiClientConfig as CoreEsiClientConfig } from './core/EsiClientConfig';
import { EsiDiagnostics as CoreEsiDiagnostics } from './core/EsiDiagnostics';
import type {
  CacheStats as CoreCacheStats,
  CircuitBreakerStats as CoreCircuitBreakerStats,
} from './core/EsiDiagnostics';
import { buildEndpointPath as coreBuildEndpointPath } from './core/endpoints/buildEndpointPath';
import { fetchAllCursorPages as coreFetchAllCursorPages } from './core/endpoints/createClient';
import type {
  CreateClientOptions as CoreCreateClientOptions,
  CursorOptions as CoreCursorOptions,
  CursorResult as CoreCursorResult,
  InferEndpointResult as CoreInferEndpointResult,
  UnwrapArray as CoreUnwrapArray,
  WithMetadata as CoreWithMetadata,
  WithSafeMode as CoreWithSafeMode,
} from './core/endpoints/createClient';
import type { DeprecationInfo as CoreDeprecationInfo } from './core/endpoints/EndpointDefinition';
import {
  fetchAllPages as coreFetchAllPages,
  fetchPages as coreFetchPages,
} from './core/pagination/AsyncPaginationIterator';
import type { PageResult as CorePageResult } from './core/pagination/AsyncPaginationIterator';
import type { CursorTokens as CoreCursorTokens } from './core/pagination/CursorPaginationHandler';

// ── The bare pipeline ────────────────────────────────────────────────────

/**
 * The request pipeline's client, for building legacy domain clients by hand.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0 from the root entry. Use
 * `createEsi()` from `@lgriffin/esi.ts/client`, which builds and configures
 * its own pipeline. Swapping the cache, rate limiter or circuit breaker is
 * tracked in guides/LEGACY-REMOVAL.md (G11).
 */
export const ApiClient: typeof CoreApiClient = CoreApiClient;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 from the root entry. Use
 * `createEsi()` from `@lgriffin/esi.ts/client`. See guides/LEGACY-REMOVAL.md.
 */
export type ApiClient = CoreApiClient;

/**
 * Configures an `ApiClient` with the middleware an `EsiClientConfig` asks for.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Pass the same settings to
 * `createEsi()` from `@lgriffin/esi.ts/client` as `EsiOptions`. See
 * guides/LEGACY-REMOVAL.md.
 */
export const configureApiClient: typeof coreConfigureApiClient =
  coreConfigureApiClient;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `configureApiClient`.
 * See guides/LEGACY-REMOVAL.md.
 */
export type ConfigureApiClientResult = CoreConfigureApiClientResult;

/**
 * What `EsiClient`, `CustomEsiClient` and `EsiApiFactory` are built from.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `EsiOptions` with
 * `createEsi()` from `@lgriffin/esi.ts/client`; the differences (environment
 * variables, `retryAttempts`, `'silent'`) are in guides/LEGACY-REMOVAL.md (G12).
 */
export type EsiClientConfig = CoreEsiClientConfig;

/**
 * Fills a legacy endpoint definition's path template and query string.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0 with the endpoint maps. The
 * generated operations build their own requests. See guides/LEGACY-REMOVAL.md.
 */
export const buildEndpointPath: typeof coreBuildEndpointPath =
  coreBuildEndpointPath;

/**
 * Migration guidance on a legacy endpoint definition.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0 with the endpoint maps. Its
 * replacement for generated operations is tracked in guides/LEGACY-REMOVAL.md (G3).
 */
export type DeprecationInfo = CoreDeprecationInfo;

// ── createClient options and results ─────────────────────────────────────

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Metadata and safe-mode views for `createEsi()` are tracked in
 * guides/LEGACY-REMOVAL.md (G8).
 */
export type CreateClientOptions = CoreCreateClientOptions;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0. Pass `before` and `after` to
 * the generated cursor-paginated operation. See guides/LEGACY-REMOVAL.md (G7).
 */
export type CursorOptions = CoreCursorOptions;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0. A generated cursor-paginated
 * operation returns the spec's body, cursor included. See
 * guides/LEGACY-REMOVAL.md (G7).
 */
export type CursorResult<T = unknown> = CoreCursorResult<T>;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0. See guides/LEGACY-REMOVAL.md (G7).
 */
export type CursorTokens = CoreCursorTokens;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the endpoint maps. A
 * generated operation's result is `Awaited<ReturnType<…>>`; nameable response
 * types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type InferEndpointResult<D> = CoreInferEndpointResult<D>;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the endpoint maps. See
 * guides/LEGACY-REMOVAL.md.
 */
export type UnwrapArray<T> = CoreUnwrapArray<T>;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `withMetadata()`. Its
 * replacement is tracked in guides/LEGACY-REMOVAL.md (G8).
 */
export type WithMetadata<T> = CoreWithMetadata<T>;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `withSafeMode()`. Its
 * replacement is tracked in guides/LEGACY-REMOVAL.md (G8).
 */
export type WithSafeMode<T> = CoreWithSafeMode<T>;

/**
 * Follows a cursor-paginated endpoint's `after` tokens to the end.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. A helper that follows the
 * generated cursor-paginated operations is tracked in guides/LEGACY-REMOVAL.md (G7).
 */
export const fetchAllCursorPages: typeof coreFetchAllCursorPages =
  coreFetchAllCursorPages;

// ── Pages, batches and diagnostics over an ApiClient ─────────────────────

/**
 * Fetches every `X-Pages` page of a path through an `ApiClient`, several at a time.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. A page-paginated generated
 * operation returns an async iterable over every item; concurrent collection
 * is tracked in guides/LEGACY-REMOVAL.md (G6).
 */
export const fetchAllPages: typeof coreFetchAllPages = coreFetchAllPages;

/**
 * Yields each `X-Pages` page of a path through an `ApiClient`.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. A page-paginated generated
 * operation returns an async iterable over every item; page-level iteration
 * is tracked in guides/LEGACY-REMOVAL.md (G6).
 */
export const fetchPages: typeof coreFetchPages = coreFetchPages;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `fetchPages`. See
 * guides/LEGACY-REMOVAL.md (G6).
 */
export type PageResult<T = unknown> = CorePageResult<T>;

/**
 * Runs a fetcher over many keys with bounded concurrency.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Its replacement for the
 * generated operations is tracked in guides/LEGACY-REMOVAL.md (G13).
 */
export const batchFetch: typeof coreBatchFetch = coreBatchFetch;

/**
 * Splits a bulk POST into chunks and joins the results.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Its replacement for the
 * generated operations is tracked in guides/LEGACY-REMOVAL.md (G13).
 */
export const batchPost: typeof coreBatchPost = coreBatchPost;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `batchFetch`. See
 * guides/LEGACY-REMOVAL.md (G13).
 */
export type BatchOptions = CoreBatchOptions;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `batchFetch`. See
 * guides/LEGACY-REMOVAL.md (G13).
 */
export type BatchResult<K, T> = CoreBatchResult<K, T>;

/**
 * Cache, circuit-breaker and deduplicator statistics for one `ApiClient`.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0 from the root entry. Diagnostics
 * on `createEsi()` are tracked in guides/LEGACY-REMOVAL.md (G9).
 */
export const EsiDiagnostics: typeof CoreEsiDiagnostics = CoreEsiDiagnostics;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 from the root entry. See
 * guides/LEGACY-REMOVAL.md (G9).
 */
export type EsiDiagnostics = CoreEsiDiagnostics;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `EsiDiagnostics`. See
 * guides/LEGACY-REMOVAL.md (G9).
 */
export type CacheStats = CoreCacheStats;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with `EsiDiagnostics`. See
 * guides/LEGACY-REMOVAL.md (G9).
 */
export type CircuitBreakerStats = CoreCircuitBreakerStats;
