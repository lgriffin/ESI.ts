import { ApiClient } from './ApiClient';
import { buildError, EsiError, TimeoutError } from '../core/util/error';
import {
  logInfo,
  logWarn,
  logError,
  logDebug,
} from '../core/logger/loggerUtil';
import { parseHeaders, ParsedHeaders } from '../core/util/headersUtil';
import { ICache } from './cache/ICache';
import { IRateLimiter } from './rateLimiter/IRateLimiter';
import { PaginationHandler, PageFetcher } from './pagination/PaginationHandler';
import { CursorTokens } from './pagination/CursorPaginationHandler';
import { USER_AGENT, COMPATIBILITY_DATE } from './constants';
import { RequestContext, ResponseContext } from './middleware/Middleware';
import { CircuitBreaker } from './circuitBreaker/CircuitBreaker';
import { esiCacheTtls } from './endpoints/esi-cache-ttls.generated';
import { retryDelay } from './util/retry';
import { sleep } from './util/sleep';
import { CircuitOpenError } from './circuitBreaker/CircuitBreaker';

export interface EsiHandlerResponse {
  headers: Record<string, string>;
  body: unknown;
  fromCache?: boolean;
  stale?: boolean;
  cacheHitType?: 'spec-ttl' | 'etag-304' | 'stale-on-error';
  responseTimeMs?: number;
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

// --- Dependency resolution ---

function resolveCache(client: ApiClient): ICache | null {
  return client.getCache();
}

function resolveRateLimiter(client: ApiClient): IRateLimiter {
  const limiter = client.getRateLimiter();
  if (!limiter) {
    throw buildError(
      'No rate limiter configured on ApiClient. ' +
        'Set one via apiClient.setRateLimiter(new RateLimiter()).',
      'CONFIGURATION_ERROR',
    );
  }
  return limiter;
}

function resolveCircuitBreaker(client: ApiClient): CircuitBreaker | null {
  return client.getCircuitBreaker();
}

// --- Pure helpers ---

import { camelToSnake } from './util/stringUtil';

function lookupSpecTtl(
  method: string,
  templatePath: string,
): number | undefined {
  const normalized = templatePath
    .replace(/\/$/, '')
    .replace(/\{(\w+)\}/g, (_, name: string) => `{${camelToSnake(name)}}`);
  const key = `${method}:${normalized}`;
  const seconds = esiCacheTtls[key];
  return typeof seconds === 'number' ? seconds * 1000 : undefined;
}

function trySpecAwareCacheHit(
  client: ApiClient,
  url: string,
  method: string,
  templatePath?: string,
): EsiHandlerResponse | null {
  if (method !== 'GET' || !templatePath) return null;
  const specTtlMs = lookupSpecTtl(method, templatePath);
  if (!specTtlMs) return null;
  const cache = resolveCache(client);
  if (!cache) return null;
  const entry = cache.get(url);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age < specTtlMs) {
    logDebug(
      `Spec-aware cache hit for ${url} (age=${Math.round(age / 1000)}s, ttl=${Math.round(specTtlMs / 1000)}s)`,
    );
    return {
      headers: entry.headers,
      body: entry.data,
      fromCache: true,
      cacheHitType: 'spec-ttl',
    };
  }
  return null;
}

const parseCacheControlTtl = (
  headers: Record<string, string>,
): number | undefined => {
  const cacheControl = headers['cache-control'] ?? headers['Cache-Control'];
  if (!cacheControl) return undefined;
  const match = /max-age=(\d+)/.exec(cacheControl);
  return match ? parseInt(match[1]!, 10) * 1000 : undefined;
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

  const language = client.getLanguage();
  if (language) {
    headers['Accept-Language'] = language;
  }

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
          cacheHitType: 'etag-304',
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
    cacheHitType: 'stale-on-error',
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
    cache.deleteByPath(endpoint.split('?')[0]!);
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
  templatePath?: string,
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
      templatePath,
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
  if (error instanceof EsiError || error instanceof CircuitOpenError) {
    throw error;
  }
  if (error instanceof Error) {
    logError(`Unexpected error: ${error.message}`);
    throw buildError(error.message, 'ESIJS_ERROR');
  }
  logError(`Unexpected error: ${String(error)}`);
  throw buildError(String(error), 'ESIJS_ERROR');
}

interface RawFetchResult {
  response: Response;
  parsed: ParsedHeaders;
  url: string;
}

async function executeSingleFetch(
  client: ApiClient,
  endpoint: string,
  method: string,
  body: unknown,
  requiresAuth: boolean,
  useETag: boolean,
  requestTimeout?: number,
  templatePath?: string,
): Promise<RawFetchResult> {
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
  await rateLimiter.checkRateLimit(templatePath, method, req.headers);

  const timeoutMs = requestTimeout ?? client.getTimeout();
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  options.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TimeoutError(timeoutMs, url);
    }
    throw err;
  }
  clearTimeout(timer);

  const parsed = parseHeaders(response.headers);

  rateLimiter.updateFromResponse(
    parsed.raw,
    response.status,
    templatePath,
    method,
    req.headers,
  );

  if (cb) {
    if (
      response.status >= 500 ||
      response.status === 420 ||
      response.status === 429
    ) {
      cb.recordFailure(endpoint, response.status);
    } else {
      cb.recordSuccess(endpoint);
    }
  }

  if (parsed.warning) {
    logWarn(
      `ESI Warning ${parsed.warning.code} for ${url}: ${parsed.warning.message}`,
    );
  }

  return { response, parsed, url };
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
  requestTimeout?: number,
  templatePath?: string,
): Promise<SingleFetchResult> {
  const { response, parsed, url } = await executeSingleFetch(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
    useETag,
    requestTimeout,
    templatePath,
  );

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
  requestTimeout?: number,
  templatePath?: string,
): Promise<EsiHandlerResponse> => {
  const startTime = Date.now();
  const finish = (r: EsiHandlerResponse) => {
    r.responseTimeMs = Date.now() - startTime;
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
    const { response, parsed, url } = await executeSingleFetch(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      useETag,
      requestTimeout,
      templatePath,
    );

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
        false,
        requestTimeout,
        templatePath,
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
      templatePath,
    );
    return finish(paginatedResult);
  } catch (error: unknown) {
    wrapError(error);
  }
};

export const handleSinglePageRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
): Promise<EsiHandlerResponse> => {
  const { data, parsed } = await fetchOnePage(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
  );
  return { headers: parsed.raw, body: data };
};

export const handleRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
  templatePath?: string,
  requestTimeout?: number,
): Promise<EsiHandlerResponse> => {
  const rawUrl = `${client.getLink()}/${endpoint}`;
  const specHit = trySpecAwareCacheHit(client, rawUrl, method, templatePath);
  if (specHit) return specHit;

  const doExecute = () =>
    executeRequest(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      useETag,
      requestTimeout,
      templatePath,
    );

  const dedup = client.getDeduplicator();
  const canDedup = dedup && method === 'GET' && !body;

  const retryConfig = client.getRetryConfig();
  const maxRetries = retryConfig?.maxRetries ?? 0;
  const canRetryMethod =
    method === 'GET' || retryConfig?.retryMutations === true;
  const baseDelayMs = retryConfig?.baseDelayMs ?? 1000;
  const maxDelayMs = retryConfig?.maxDelayMs ?? 30000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return canDedup
        ? await dedup.dedupe<EsiHandlerResponse>(endpoint, doExecute)
        : await doExecute();
    } catch (error: unknown) {
      if (error instanceof CircuitOpenError) {
        throw error;
      }

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
            requestTimeout,
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

      if (
        error instanceof EsiError &&
        error.retryable &&
        canRetryMethod &&
        attempt < maxRetries
      ) {
        const delay = retryDelay(attempt, baseDelayMs, maxDelayMs);
        logWarn(
          `Request to ${endpoint} failed (${error.statusCode}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await sleep(delay);
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};
