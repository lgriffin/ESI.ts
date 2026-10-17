/**
 * One runtime, many identities.
 *
 * `createEsi` builds one `ApiClient` that owns the rate limiter, the circuit
 * breaker, the deduplicator and the ETag cache, and hands out views over it.
 * `esi.public` reaches the operations that need no scope. `esi.as(identity)`
 * reaches every operation as one character: it is a second `ApiClient` that
 * holds that identity's token and shares every other object with the runtime,
 * so two views draw on one error budget and one cache, and the cache keys
 * (`src/core/cache/cacheKey.ts`) keep their authenticated entries apart by
 * the character each token names.
 *
 * `esi.withMetadata()` and `esi.withSafeMode()` hand out the same two views
 * over the same clients, answering `{ data, meta }` or `{ ok, ... }`; the
 * diagnostics read and reset the shared middleware; and `EsiOptions` takes
 * middleware instances (a cache store, rate limiter, circuit breaker,
 * deduplicator and clock) in place of the ones it would build.
 */
import {
  PipelineTransport,
  type PipelineTransportOptions,
} from '../adapters/PipelineTransport';
import { ApiClient, type EsiDatasource } from '../core/ApiClient';
import type { CircuitBreakerConfig } from '../core/circuitBreaker/CircuitBreaker';
import type { ETagCacheConfig } from '../core/cache/ETagCacheManager';
import { cacheFromStore } from '../core/cache/CacheStoreCache';
import type { ICircuitBreaker } from '../core/circuitBreaker/ICircuitBreaker';
import { configureApiClient } from '../core/configureApiClient';
import {
  type CacheStats,
  type CircuitBreakerStats,
  EsiDiagnostics,
} from '../core/EsiDiagnostics';
import type { IDeduplicator } from '../core/IDeduplicator';
import type { IRetryStrategy } from '../core/IRetryStrategy';
import type { LogLevel } from '../core/logger/DefaultLogger';
import type {
  RequestInterceptor,
  ResponseInterceptor,
} from '../core/middleware/Middleware';
import type { CacheStore } from '../core/ports/CacheStore';
import type { Clock } from '../core/ports/Clock';
import type { HttpTransport } from '../core/ports/HttpTransport';
import type { Identity } from '../core/ports/Identity';
import type { Logger } from '../core/ports/Logger';
import type {
  OperationMeta,
  OperationRequest,
  OperationTransport,
} from '../core/ports/OperationTransport';
import type { IncompletePagesMode } from '../core/pagination/pageLimit';
import type { IRateLimiter } from '../core/rateLimiter/IRateLimiter';
import type { RateLimiterConfig } from '../core/rateLimiter/RateLimiter';
import { EsiConfigurationError } from '../core/util/error';
import { RetryConfig } from '../core/util/retry';
import { validateBaseUrl, validateHeaderOption } from '../core/util/validation';
import {
  createScopeTree,
  type PublicScopeTree,
  type ScopeTree,
} from '../generated/operations.generated';
import {
  type EsiViews,
  type MetadataView,
  MetadataTransport,
  SafeTransport,
  type SafeView,
} from './modes';

/** What `createEsi` takes. Everything but the user agent has a default. */
export interface EsiOptions {
  /**
   * Who is calling, for CCP to contact: an application name, version and a
   * contact address, such as `fleet-tool/2.1 (ops@example.com)`. Sent as
   * `X-User-Agent` and at the start of `User-Agent`. Required: the runtime
   * refuses to construct without one.
   */
  readonly userAgent: string;
  /** Defaults to `https://esi.evetech.net`. Another host needs `unsafeAllowCustomHost`. */
  readonly baseUrl?: string;
  readonly unsafeAllowCustomHost?: boolean;
  /** The ESI tenant every request names in `X-Tenant`; unset, ESI serves Tranquility. */
  readonly tenant?: string;
  readonly datasource?: EsiDatasource;
  readonly compatibilityDate?: string;
  readonly language?: string;
  /** Sends each HTTP request. Defaults to `globalThis.fetch`. */
  readonly transport?: HttpTransport;
  readonly timeout?: number;
  readonly retryConfig?: RetryConfig;
  readonly retryStrategy?: IRetryStrategy;
  readonly rateLimiterConfig?: RateLimiterConfig;
  readonly enableETagCache?: boolean;
  readonly etagCacheConfig?: ETagCacheConfig;
  readonly enableCircuitBreaker?: boolean;
  readonly circuitBreakerConfig?: CircuitBreakerConfig;
  readonly enableRequestDeduplication?: boolean;
  readonly requestInterceptors?: readonly RequestInterceptor[];
  readonly responseInterceptors?: readonly ResponseInterceptor[];
  /**
   * Set `true` to check each response against the operation's Zod schema,
   * generated from the OpenAPI document, and throw `EsiValidationError` on a
   * mismatch. Unset or `false`, the generated operations return bodies as ESI
   * sent them, as they always have. A future major release will make
   * validation the default for `createEsi`; set `false` to keep bodies
   * unvalidated then.
   */
  readonly validateResponse?: boolean;
  readonly validateRequest?: boolean;
  /**
   * What pagination does when it cannot prove a walk complete (a page count
   * above 1000, an empty page after the first). `'truncate'`, the default,
   * yields the pages fetched so far and logs a warning; `'throw'` rejects with
   * an `EsiPaginationError` carrying the reason. The default becomes
   * `'throw'` in a future major. See guides/PAGINATION.md.
   */
  readonly incompletePages?: IncompletePagesMode;
  /** Where the pipeline logs. Defaults to the package's pino logger at `logLevel`. */
  readonly logger?: Logger;
  readonly logLevel?: LogLevel;
  /**
   * Where the conditional-request cache keeps bodies and ETags, in place of
   * the in-memory cache `etagCacheConfig` configures: a shared store (Redis,
   * a file) implementing the `CacheStore` port, or an `ICache` such as an
   * `ETagCacheManager`. Ignored when `enableETagCache` is `false`. The
   * runtime does not shut it down; its owner does.
   */
  readonly cache?: CacheStore;
  /** The rate limiter every view draws on, in place of the one `rateLimiterConfig` builds. */
  readonly rateLimiter?: IRateLimiter;
  /**
   * The circuit breaker every view goes through, in place of the one
   * `circuitBreakerConfig` builds. Supplying one turns the breaker on. The
   * runtime does not shut it down; its owner does.
   */
  readonly circuitBreaker?: ICircuitBreaker;
  /** The in-flight table identical GETs join. Supplying one turns deduplication on. */
  readonly deduplicator?: IDeduplicator;
  /**
   * Where the pipeline reads time and waits: cache entry age, retry back-off,
   * the rate limiter's windows and waits, the circuit breaker's reset timeout
   * and response times. Defaults to the wall clock and real timers. The
   * cleanup timers and the request timeout always run on real time, and a
   * supplied middleware instance keeps whatever clock it was built with.
   */
  readonly clock?: Clock;
}

/**
 * Reads and resets the middleware every view shares. Each answers for the
 * whole runtime, not for one view.
 */
export interface RuntimeDiagnostics {
  /** The cache's entries, hits and misses; null when the ETag cache is off. */
  getCacheStats(): CacheStats | null;
  /** Drops every view's cached entries. */
  clearCache(): void;
  /** Changes the built-in cache's limits in place; a supplied cache keeps its own. */
  updateCacheConfig(config: Partial<ETagCacheConfig>): void;
  /** Each endpoint's circuit and failure count; null when the circuit breaker is off. */
  getCircuitBreakerStats(): CircuitBreakerStats | null;
  /** Closes one endpoint's circuit, or every circuit when `endpoint` is left out. */
  resetCircuitBreaker(endpoint?: string): void;
  /** How many requests are in flight for others to join; null when deduplication is off. */
  getDeduplicatorStats(): { pendingRequests: number } | null;
}

/** One runtime and its views. */
export interface Esi {
  /** The operations that need no scope. An authenticated one does not compile here. */
  readonly public: PublicScopeTree;
  /**
   * Every operation, as `identity`. The view is immutable and shares the
   * runtime's budgets and cache; the same `Identity` object gets the same
   * view back.
   */
  as(identity: Identity): ScopeTree;
  /**
   * The same views, over the same clients and middleware, with every
   * single-answer operation resolving `{ data, meta }`: the body and the
   * response metadata (ETag, `Expires`, `X-Pages`, the error-limit headers,
   * whether the cache answered). Paginated operations still yield items.
   * The same object comes back on every call.
   */
  withMetadata(): EsiViews<
    MetadataView<PublicScopeTree>,
    MetadataView<ScopeTree>
  >;
  /**
   * The same views with every single-answer operation resolving
   * `{ ok: true, data, meta }` or `{ ok: false, error }` instead of
   * rejecting. Paginated operations still yield items and reject on failure.
   * The same object comes back on every call.
   */
  withSafeMode(): EsiViews<SafeView<PublicScopeTree>, SafeView<ScopeTree>>;
  /** The shared middleware's statistics and resets; the methods below are shortcuts to it. */
  readonly diagnostics: RuntimeDiagnostics;
  getCacheStats(): CacheStats | null;
  clearCache(): void;
  updateCacheConfig(config: Partial<ETagCacheConfig>): void;
  getCircuitBreakerStats(): CircuitBreakerStats | null;
  resetCircuitBreaker(endpoint?: string): void;
  /**
   * Stops the cleanup timers of the cache and circuit breaker the runtime
   * built and drops its in-flight table; a supplied cache, circuit breaker or
   * deduplicator is left to its owner. Safe to call more than once; the views
   * still answer afterwards. One call per runtime, not per view.
   */
  shutdown(): void;
}

const CLIENT_ID = 'esi-runtime';

/** Throws NO_AUTH_TOKEN for a scoped operation: the public view holds no token. */
class PublicTransport implements OperationTransport {
  constructor(private readonly inner: OperationTransport) {}

  request<T>(meta: OperationMeta, req: OperationRequest): Promise<T> {
    refusePublic(meta);
    return this.inner.request<T>(meta, req);
  }

  paginate<T>(meta: OperationMeta, req: OperationRequest): AsyncIterable<T> {
    refusePublic(meta);
    return this.inner.paginate<T>(meta, req);
  }
}

function refusePublic(meta: OperationMeta): void {
  if (meta.scopes.length === 0) return;
  throw new EsiConfigurationError(
    'NO_AUTH_TOKEN',
    `${meta.operationId} requires ${meta.scopes.join(', ')} and the public view holds no token. Fix: call it through esi.as(identity)`,
  );
}

/**
 * Asks the identity for its token before each request, so a holder that
 * refreshes ahead of expiry is honoured, and installs the refresh as the
 * client's token provider, so the 401 path in the retry strategy reaches it.
 */
class IdentityTransport implements OperationTransport {
  constructor(
    private readonly client: ApiClient,
    private readonly identity: Identity,
    private readonly inner: OperationTransport,
  ) {}

  async request<T>(meta: OperationMeta, req: OperationRequest): Promise<T> {
    await this.prepare(meta);
    return this.inner.request<T>(meta, req);
  }

  /**
   * Each page is its own request, and a consumer may hold the iterator across
   * a token rotation, so the identity is asked again before every page.
   */
  async *paginate<T>(
    meta: OperationMeta,
    req: OperationRequest,
  ): AsyncIterable<T> {
    const pages = this.inner.paginate<T>(meta, req)[Symbol.asyncIterator]();
    try {
      for (;;) {
        await this.prepare(meta);
        const next = await pages.next();
        if (next.done) return;
        yield next.value;
      }
    } finally {
      await pages.return?.();
    }
  }

  private async prepare(meta: OperationMeta): Promise<void> {
    if (meta.scopes.length === 0) return;
    this.client.setAccessToken(await this.identity.accessToken());
  }
}

/**
 * A client that sends as `identity` and shares everything else with the
 * runtime. The middleware objects carry a client back-reference for logging
 * only, so sharing them is sound; the cache and deduplicator scope their keys
 * by the token each client sends.
 */
function viewClient(
  runtime: ApiClient,
  options: EsiOptions,
  identity: Identity,
): ApiClient {
  const client = new ApiClient(CLIENT_ID, runtime.getLink());
  client.setCache(runtime.getCache());
  client.setRateLimiter(runtime.getRateLimiter());
  client.setCircuitBreaker(runtime.getCircuitBreaker());
  client.setDeduplicator(runtime.getDeduplicator());
  client.setRetryConfig(runtime.getRetryConfig());
  client.setRetryStrategy(runtime.getRetryStrategy());
  client.setValidateResponse(runtime.getValidateResponse());
  client.setValidateRequest(runtime.getValidateRequest());
  client.setIncompletePages(runtime.getIncompletePages());
  client.setTimeout(runtime.getTimeout());
  client.setLogger(runtime.getLogger());
  client.setTenant(runtime.getTenant());
  client.setUserAgent(runtime.getUserAgent());
  client.setCompatibilityDate(runtime.getCompatibilityDate());
  client.setDatasource(runtime.getDatasource());
  client.setLanguage(runtime.getLanguage());
  client.setClock(runtime.getClock());
  if (options.transport) client.setFetch(options.transport);
  for (const fn of options.requestInterceptors ?? []) {
    client.addRequestInterceptor(fn);
  }
  for (const fn of options.responseInterceptors ?? []) {
    client.addResponseInterceptor(fn);
  }
  if (identity.refreshAccessToken) {
    client.setTokenProvider(() => identity.refreshAccessToken!());
  }
  return client;
}

export function createEsi(options: EsiOptions): Esi {
  if (typeof options.userAgent !== 'string' || options.userAgent === '') {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      'userAgent is required: an application name, version and contact address',
    );
  }
  validateHeaderOption('userAgent', options.userAgent);

  const baseUrl = validateBaseUrl(
    options.baseUrl ?? 'https://esi.evetech.net',
    options.unsafeAllowCustomHost,
  );
  const runtime = new ApiClient(CLIENT_ID, baseUrl);
  if (options.datasource) runtime.setDatasource(options.datasource);
  if (options.language) runtime.setLanguage(options.language);
  if (options.compatibilityDate) {
    runtime.setCompatibilityDate(options.compatibilityDate);
  }
  if (options.transport) runtime.setFetch(options.transport);
  configureApiClient(
    runtime,
    {
      ...options,
      requestInterceptors: options.requestInterceptors?.slice(),
      responseInterceptors: options.responseInterceptors?.slice(),
    },
    {
      cache: options.cache && cacheFromStore(options.cache),
      rateLimiter: options.rateLimiter,
      circuitBreaker: options.circuitBreaker,
      deduplicator: options.deduplicator,
      clock: options.clock,
    },
  );

  // Only an explicit `true` validates the generated operations: the
  // ApiClient's validateResponse defaults to true for the hand-written
  // clients, and the generated operations have returned bodies unchecked
  // since the runtime shipped.
  const transportOptions: PipelineTransportOptions = {
    validateResponse: options.validateResponse === true,
  };
  const base = (mode: Mode, client: ApiClient): OperationTransport =>
    mode === 'plain'
      ? new PipelineTransport(client, transportOptions)
      : new MetadataTransport(client, transportOptions);

  const clients = new WeakMap<Identity, ApiClient>();
  const clientFor = (identity: Identity): ApiClient => {
    let client = clients.get(identity);
    if (!client) {
      client = viewClient(runtime, options, identity);
      clients.set(identity, client);
    }
    return client;
  };
  const views = <TPublic, TScoped>(mode: Mode): EsiViews<TPublic, TScoped> => {
    const byIdentity = new WeakMap<Identity, TScoped>();
    return Object.freeze({
      public: createScopeTree(
        inMode(mode, new PublicTransport(base(mode, runtime))),
      ) as unknown as TPublic,
      as(identity: Identity): TScoped {
        const known = byIdentity.get(identity);
        if (known) return known;
        const client = clientFor(identity);
        const view = createScopeTree(
          inMode(
            mode,
            new IdentityTransport(client, identity, base(mode, client)),
          ),
        ) as unknown as TScoped;
        byIdentity.set(identity, view);
        return view;
      },
    });
  };

  const plain = views<PublicScopeTree, ScopeTree>('plain');
  let metadata:
    | EsiViews<MetadataView<PublicScopeTree>, MetadataView<ScopeTree>>
    | undefined;
  let safe:
    EsiViews<SafeView<PublicScopeTree>, SafeView<ScopeTree>> | undefined;
  const diagnostics: RuntimeDiagnostics = new EsiDiagnostics(
    runtime,
    runtime.getCache() !== null,
    runtime.getDeduplicator(),
  );
  return Object.freeze({
    public: plain.public,
    as: (identity: Identity): ScopeTree => plain.as(identity),
    withMetadata() {
      metadata ??= views('metadata');
      return metadata;
    },
    withSafeMode() {
      safe ??= views('safe');
      return safe;
    },
    diagnostics,
    getCacheStats: () => diagnostics.getCacheStats(),
    clearCache: () => diagnostics.clearCache(),
    updateCacheConfig: (config: Partial<ETagCacheConfig>) =>
      diagnostics.updateCacheConfig(config),
    getCircuitBreakerStats: () => diagnostics.getCircuitBreakerStats(),
    resetCircuitBreaker: (endpoint?: string) =>
      diagnostics.resetCircuitBreaker(endpoint),
    shutdown(): void {
      if (!options.cache) runtime.getCache()?.shutdown();
      if (!options.circuitBreaker) runtime.getCircuitBreaker()?.shutdown();
      if (!options.deduplicator) runtime.getDeduplicator()?.clear();
    },
  });
}

type Mode = 'plain' | 'metadata' | 'safe';

/** The guarded transport, turned into results in safe mode. */
function inMode(mode: Mode, guarded: OperationTransport): OperationTransport {
  return mode === 'safe' ? new SafeTransport(guarded) : guarded;
}
