import { ApiClient } from './ApiClient';
import { buildError, EsiError } from '../core/util/error';
import {
  logInfo,
  logWarn,
  logError,
  logDebug,
} from '../core/logger/loggerUtil';
import { parseHeaders, ParsedHeaders } from '../core/util/headersUtil';
import { ETagCacheManager } from './cache/ETagCacheManager';
import { ICache } from './cache/ICache';
import { IRateLimiter } from './rateLimiter/IRateLimiter';
import { RateLimiter } from './rateLimiter/RateLimiter';
import { PaginationHandler, PageFetcher } from './pagination/PaginationHandler';
import { CursorTokens } from './pagination/CursorPaginationHandler';
import { USER_AGENT, COMPATIBILITY_DATE } from './constants';
import { RequestContext, ResponseContext } from './middleware/Middleware';
import {
  CircuitBreaker,
  CircuitBreakerConfig,
} from './circuitBreaker/CircuitBreaker';

export interface EsiHandlerResponse {
  headers: Record<string, string>;
  body: unknown;
  fromCache?: boolean;
  stale?: boolean;
  cursors?: CursorTokens;
}

const STATUS_MESSAGES: Record<number, string> = {
  201: 'Created',
  204: 'No Content',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Resource not found',
  420: 'Error Limited',
  422: 'Unprocessable Entity',
  429: 'Too many requests',
  500: 'Internal server error',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  520: 'Internal server error, did the request terminate too soon?',
};

// --- Global instance management (backward compat) ---

let globalCache: ETagCacheManager | null = null;
let globalCircuitBreaker: CircuitBreaker | null = null;

export const initializeETagCache = (
  config?: ConstructorParameters<typeof ETagCacheManager>[0],
): ETagCacheManager => {
  if (!globalCache) {
    globalCache = new ETagCacheManager(config);
  }
  return globalCache;
};

export const getETagCache = (): ETagCacheManager | null => {
  return globalCache;
};

export const resetETagCache = (): void => {
  if (globalCache) {
    globalCache.shutdown();
  }
  globalCache = null;
};

export const initializeCircuitBreaker = (
  config?: CircuitBreakerConfig,
): CircuitBreaker => {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new CircuitBreaker(config);
  }
  return globalCircuitBreaker;
};

export const getCircuitBreaker = (): CircuitBreaker | null => {
  return globalCircuitBreaker;
};

export const resetCircuitBreaker = (): void => {
  globalCircuitBreaker = null;
};

// --- Dependency resolution ---

function resolveCache(client: ApiClient): ICache | null {
  return client.getCache() ?? globalCache;
}

function resolveRateLimiter(client: ApiClient): IRateLimiter {
  return client.getRateLimiter() ?? RateLimiter.getInstance();
}

function resolveCircuitBreaker(client: ApiClient): CircuitBreaker | null {
  return client.getCircuitBreaker() ?? globalCircuitBreaker;
}

// --- Pure helpers ---

const parseCacheControlTtl = (
  headers: Record<string, string>,
): number | undefined => {
  const cacheControl = headers['cache-control'] || headers['Cache-Control'];
  if (!cacheControl) return undefined;
  const match = /max-age=(\d+)/.exec(cacheControl);
  return match ? parseInt(match[1], 10) * 1000 : undefined;
};

function buildRequestHeaders(
  client: ApiClient,
  url: string,
  method: string,
  requiresAuth: boolean,
  useETag: boolean,
  body: unknown,
): HeadersInit {
  const headers: HeadersInit = {
    accept: 'gzip, deflate, br',
    'User-Agent': USER_AGENT,
    'X-Compatibility-Date': COMPATIBILITY_DATE,
  };

  if (requiresAuth) {
    const authHeader = client.getAuthorizationHeader();
    if (!authHeader) {
      throw buildError(
        'Authorization header is required but not provided',
        'NO_AUTH_TOKEN',
      );
    }
    headers['Authorization'] = authHeader;
  }

  const cache = resolveCache(client);
  if (useETag && method === 'GET' && cache) {
    const cachedETag = cache.getETag(url);
    if (cachedETag) {
      headers['If-None-Match'] = cachedETag;
      logDebug(`Adding If-None-Match header: ${cachedETag}`);
    }
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function handleEarlyStatus(
  client: ApiClient,
  status: number,
  url: string,
  parsed: ParsedHeaders,
  useETag: boolean,
): EsiHandlerResponse | null {
  if (status === 201) {
    return { headers: parsed.raw, body: undefined };
  }

  if (status === 204) {
    logInfo(`No Content for endpoint: ${url}`);
    return { headers: parsed.raw, body: undefined };
  }

  if (status === 304) {
    const cache = resolveCache(client);
    if (useETag && cache) {
      const cachedEntry = cache.get(url);
      if (cachedEntry) {
        logInfo(`Cache hit (304) for endpoint: ${url}`);
        return {
          headers: { ...cachedEntry.headers, ...parsed.raw },
          body: cachedEntry.data,
          fromCache: true,
        };
      }
    }
    throw new EsiError(
      304,
      'Not Modified — no cached data available',
      url,
      parsed.requestId ?? undefined,
    );
  }

  return null;
}

function tryStaleCacheResponse(
  client: ApiClient,
  url: string,
  parsed: ParsedHeaders,
): EsiHandlerResponse | null {
  const cache = resolveCache(client);
  if (!cache) return null;
  const cachedEntry = cache.get(url);
  if (!cachedEntry) return null;
  return {
    headers: { ...cachedEntry.headers, ...parsed.raw },
    body: cachedEntry.data,
    fromCache: true,
    stale: true,
  };
}

function cacheResponse(
  client: ApiClient,
  url: string,
  method: string,
  endpoint: string,
  parsed: ParsedHeaders,
  data: unknown,
  useETag: boolean,
): void {
  const cache = resolveCache(client);
  if (useETag && method === 'GET' && cache && parsed.etag) {
    const ttl = parseCacheControlTtl(parsed.raw);
    cache.set(url, parsed.etag, data, parsed.raw, ttl);
    const ttlInfo = ttl ? ` (ttl=${ttl}ms)` : '';
    logDebug(`Cached response for ${url} with ETag ${parsed.etag}${ttlInfo}`);
  }

  if (method !== 'GET' && cache) {
    cache.deleteByPath(endpoint.split('?')[0]);
  }
}

async function parseJsonBody(
  response: Response,
  _url: string,
): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (jsonError) {
    const msg =
      jsonError instanceof Error ? jsonError.message : String(jsonError);
    logError(`Failed to parse JSON response: ${msg}`);
    throw buildError(`Invalid JSON response: ${msg}`, 'JSON_PARSE_ERROR');
  }
}

function handleCursorPagination(
  parsed: ParsedHeaders,
  data: unknown,
): EsiHandlerResponse | null {
  if (!parsed.hasCursorPagination) return null;

  const cursors: CursorTokens = {
    before: parsed.cursorBefore,
    after: parsed.cursorAfter,
  };

  return { headers: parsed.raw, body: data, cursors };
}

async function handleOffsetPagination(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean,
  parsed: ParsedHeaders,
  data: unknown,
  body: unknown,
  url: string,
  useETag: boolean,
  pageFetch?: PageFetcher,
): Promise<EsiHandlerResponse> {
  const totalPages = parsed.xPages;

  if (totalPages <= 1) {
    return { headers: parsed.raw, body: data };
  }

  logInfo(
    `Found ${totalPages} pages, fetching additional pages with rate limiting...`,
  );

  try {
    const firstPageData = Array.isArray(data) ? data : [data];
    const allData = await PaginationHandler.fetchRemainingPages(
      client,
      endpoint,
      method,
      requiresAuth,
      firstPageData,
      totalPages,
      body,
      {
        maxPages: Math.min(totalPages, 1000),
        stopOnEmptyPage: true,
        maxRetries: 3,
      },
      pageFetch,
    );

    cacheResponse(client, url, method, endpoint, parsed, allData, useETag);
    return { headers: parsed.raw, body: allData };
  } catch (paginationError: unknown) {
    const msg =
      paginationError instanceof Error
        ? paginationError.message
        : String(paginationError);
    logWarn(`Pagination failed, returning first page only: ${msg}`);
    return { headers: parsed.raw, body: data };
  }
}

// --- Response interceptor wrapper ---

async function applyResponseInterceptors(
  client: ApiClient,
  result: EsiHandlerResponse,
  url: string,
  endpoint: string,
  method: string,
  startTime: number,
): Promise<EsiHandlerResponse> {
  const middleware = client.getMiddleware();
  if (!middleware.hasInterceptors()) return result;

  const responseCtx: ResponseContext = {
    url,
    endpoint,
    method,
    status: 200,
    headers: result.headers,
    body: result.body,
    durationMs: Date.now() - startTime,
    fromCache: result.fromCache ?? false,
  };

  const modified = await middleware.applyResponseInterceptors(responseCtx);
  return {
    ...result,
    headers: modified.headers,
    body: modified.body,
  };
}

// --- Main request functions ---

async function applyRequestMiddleware(
  client: ApiClient,
  url: string,
  endpoint: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ url: string; headers: Record<string, string>; body: unknown }> {
  const middleware = client.getMiddleware();
  if (!middleware.hasInterceptors()) {
    return { url, headers, body };
  }
  const reqCtx: RequestContext = {
    url,
    endpoint,
    method,
    headers: { ...headers },
    body,
  };
  const modified = await middleware.applyRequestInterceptors(reqCtx);
  return {
    url: modified.url,
    headers: modified.headers,
    body: modified.body,
  };
}

function handleErrorResponse(
  client: ApiClient,
  response: Response,
  url: string,
  parsed: ParsedHeaders,
  useETag: boolean,
): EsiHandlerResponse | never {
  const errorMessage = STATUS_MESSAGES[response.status] || response.statusText;

  if (response.status >= 500 && useETag) {
    const staleResult = tryStaleCacheResponse(client, url, parsed);
    if (staleResult) {
      logWarn(`${errorMessage} for ${url} — serving stale cache`);
      return staleResult;
    }
  }

  if (response.status === 420 || response.status === 429) {
    logWarn(`Rate limited (${response.status}) on ${url}`);
  }

  throw new EsiError(
    response.status,
    errorMessage,
    url,
    parsed.requestId ?? undefined,
  );
}

function wrapError(error: unknown): never {
  if (error instanceof EsiError) {
    throw error;
  }
  if (error instanceof Error) {
    logError(`Unexpected error: ${error.message}`);
    throw buildError(error.message, 'ESIJS_ERROR');
  }
  logError(`Unexpected error: ${String(error)}`);
  throw buildError(String(error), 'ESIJS_ERROR');
}

interface SingleFetchResult {
  data: unknown;
  parsed: ParsedHeaders;
  url: string;
}

async function fetchOnePage(
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = false,
): Promise<SingleFetchResult> {
  const rawUrl = `${client.getLink()}/${endpoint}`;
  const builtHeaders = buildRequestHeaders(
    client,
    rawUrl,
    method,
    requiresAuth,
    useETag,
    body,
  ) as Record<string, string>;

  const req = await applyRequestMiddleware(
    client,
    rawUrl,
    endpoint,
    method,
    builtHeaders,
    body,
  );

  const options: RequestInit = {
    method,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : undefined,
  };

  const url = req.url;
  logInfo(`Hitting endpoint: ${url}`);

  const cb = resolveCircuitBreaker(client);
  if (cb) cb.checkCircuit(endpoint);

  const rateLimiter = resolveRateLimiter(client);
  await rateLimiter.checkRateLimit();

  const response = await fetch(url, options);
  const parsed = parseHeaders(response.headers);

  rateLimiter.updateFromResponse(parsed.raw, response.status);

  if (cb) {
    if (response.status >= 500) cb.recordFailure(endpoint, response.status);
    else cb.recordSuccess(endpoint);
  }

  if (parsed.warning) {
    logWarn(
      `ESI Warning ${parsed.warning.code} for ${url}: ${parsed.warning.message}`,
    );
  }

  if (!response.ok) {
    throw new EsiError(
      response.status,
      STATUS_MESSAGES[response.status] || response.statusText,
      url,
      parsed.requestId ?? undefined,
    );
  }

  const data = await parseJsonBody(response, url);
  return { data, parsed, url };
}

const executeRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
): Promise<EsiHandlerResponse> => {
  const startTime = Date.now();
  const finish = (r: EsiHandlerResponse) => {
    const rawUrl = `${client.getLink()}/${endpoint}`;
    return applyResponseInterceptors(
      client,
      r,
      rawUrl,
      endpoint,
      method,
      startTime,
    );
  };

  try {
    const rawUrl = `${client.getLink()}/${endpoint}`;
    const builtHeaders = buildRequestHeaders(
      client,
      rawUrl,
      method,
      requiresAuth,
      useETag,
      body,
    ) as Record<string, string>;

    const req = await applyRequestMiddleware(
      client,
      rawUrl,
      endpoint,
      method,
      builtHeaders,
      body,
    );

    const options: RequestInit = {
      method,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    };

    const url = req.url;
    logInfo(`Hitting endpoint: ${url}`);

    const cb = resolveCircuitBreaker(client);
    if (cb) cb.checkCircuit(endpoint);

    const rateLimiter = resolveRateLimiter(client);
    await rateLimiter.checkRateLimit();

    const response = await fetch(url, options);
    const parsed = parseHeaders(response.headers);

    rateLimiter.updateFromResponse(parsed.raw, response.status);

    if (cb) {
      if (response.status >= 500) cb.recordFailure(endpoint, response.status);
      else cb.recordSuccess(endpoint);
    }

    if (parsed.warning) {
      logWarn(
        `ESI Warning ${parsed.warning.code} for ${url}: ${parsed.warning.message}`,
      );
    }

    if (response.status === 201) {
      let data: unknown;
      try {
        data = (await response.json()) as unknown;
      } catch {
        data = undefined;
      }
      return finish({ headers: parsed.raw, body: data });
    }

    const earlyResult = handleEarlyStatus(
      client,
      response.status,
      url,
      parsed,
      useETag,
    );
    if (earlyResult) return finish(earlyResult);

    if (!response.ok) {
      const staleOrThrow = handleErrorResponse(
        client,
        response,
        url,
        parsed,
        useETag,
      );
      return finish(staleOrThrow);
    }

    const data = await parseJsonBody(response, url);
    cacheResponse(client, url, method, endpoint, parsed, data, useETag);

    const cursorResult = handleCursorPagination(parsed, data);
    if (cursorResult) return finish(cursorResult);

    const pageFetch = async (paginatedEndpoint: string): Promise<unknown[]> => {
      const result = await fetchOnePage(
        client,
        paginatedEndpoint,
        method,
        body,
        requiresAuth,
      );
      return Array.isArray(result.data)
        ? (result.data as unknown[])
        : [result.data];
    };

    const paginatedResult = await handleOffsetPagination(
      client,
      endpoint,
      method,
      requiresAuth,
      parsed,
      data,
      body,
      url,
      useETag,
      pageFetch,
    );
    return finish(paginatedResult);
  } catch (error: unknown) {
    wrapError(error);
  }
};

export const handleRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
): Promise<EsiHandlerResponse> => {
  try {
    return await executeRequest(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      useETag,
    );
  } catch (error: unknown) {
    if (
      error instanceof EsiError &&
      error.statusCode === 401 &&
      requiresAuth &&
      client.hasTokenProvider()
    ) {
      logInfo('Received 401, attempting token refresh...');
      try {
        await client.refreshToken();
        logInfo('Token refreshed, retrying request');
        return await executeRequest(
          client,
          endpoint,
          method,
          body,
          requiresAuth,
          useETag,
        );
      } catch (refreshError: unknown) {
        if (refreshError instanceof EsiError) {
          throw refreshError;
        }
        const msg =
          refreshError instanceof Error
            ? refreshError.message
            : String(refreshError);
        logError(`Token refresh failed: ${msg}`);
        throw buildError(
          `Token refresh failed: ${msg}`,
          'TOKEN_REFRESH_FAILED',
        );
      }
    }
    throw error;
  }
};
