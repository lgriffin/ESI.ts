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
 */
import { PipelineTransport } from '../adapters/PipelineTransport';
import { ApiClient, type EsiDatasource } from '../core/ApiClient';
import type { CircuitBreakerConfig } from '../core/circuitBreaker/CircuitBreaker';
import type { ETagCacheConfig } from '../core/cache/ETagCacheManager';
import { configureApiClient } from '../core/configureApiClient';
import type { IRetryStrategy } from '../core/IRetryStrategy';
import type { LogLevel } from '../core/logger/DefaultLogger';
import type {
  RequestInterceptor,
  ResponseInterceptor,
} from '../core/middleware/Middleware';
import type { HttpTransport } from '../core/ports/HttpTransport';
import type { Identity } from '../core/ports/Identity';
import type { Logger } from '../core/ports/Logger';
import type {
  OperationMeta,
  OperationRequest,
  OperationTransport,
} from '../core/ports/OperationTransport';
import type { RateLimiterConfig } from '../core/rateLimiter/RateLimiter';
import { buildError } from '../core/util/error';
import { RetryConfig } from '../core/util/retry';
import { validateBaseUrl, validateHeaderOption } from '../core/util/validation';
import {
  createScopeTree,
  type PublicScopeTree,
  type ScopeTree,
} from '../generated/operations.generated';

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
  readonly validateResponse?: boolean;
  readonly validateRequest?: boolean;
  /** Where the pipeline logs. Defaults to the package's pino logger at `logLevel`. */
  readonly logger?: Logger;
  readonly logLevel?: LogLevel;
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
  throw buildError(
    `${meta.operationId} requires ${meta.scopes.join(', ')} and the public view holds no token. Fix: call it through esi.as(identity)`,
    'NO_AUTH_TOKEN',
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

  async *paginate<T>(
    meta: OperationMeta,
    req: OperationRequest,
  ): AsyncIterable<T> {
    await this.prepare(meta);
    yield* this.inner.paginate<T>(meta, req);
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
  client.setTimeout(runtime.getTimeout());
  client.setLogger(runtime.getLogger());
  client.setTenant(runtime.getTenant());
  client.setUserAgent(runtime.getUserAgent());
  client.setCompatibilityDate(runtime.getCompatibilityDate());
  client.setDatasource(runtime.getDatasource());
  client.setLanguage(runtime.getLanguage());
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
    throw buildError(
      'userAgent is required: an application name, version and contact address',
      'VALIDATION_ERROR',
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
  configureApiClient(runtime, {
    ...options,
    requestInterceptors: options.requestInterceptors?.slice(),
    responseInterceptors: options.responseInterceptors?.slice(),
  });

  const views = new WeakMap<Identity, ScopeTree>();
  return Object.freeze({
    public: createScopeTree(
      new PublicTransport(new PipelineTransport(runtime)),
    ),
    as(identity: Identity): ScopeTree {
      const known = views.get(identity);
      if (known) return known;
      const client = viewClient(runtime, options, identity);
      const view = createScopeTree(
        new IdentityTransport(client, identity, new PipelineTransport(client)),
      );
      views.set(identity, view);
      return view;
    },
  });
}
