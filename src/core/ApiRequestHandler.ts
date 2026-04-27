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
import { RateLimiter } from './rateLimiter/RateLimiter';
import { PaginationHandler } from './pagination/PaginationHandler';
import { CursorTokens } from './pagination/CursorPaginationHandler';
import { USER_AGENT, COMPATIBILITY_DATE } from './constants';

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

// Global ETag cache instance
let etagCache: ETagCacheManager | null = null;

export const initializeETagCache = (
  config?: ConstructorParameters<typeof ETagCacheManager>[0],
): ETagCacheManager => {
  if (!etagCache) {
    etagCache = new ETagCacheManager(config);
  }
  return etagCache;
};

export const getETagCache = (): ETagCacheManager | null => {
  return etagCache;
};

export const resetETagCache = (): void => {
  if (etagCache) {
    etagCache.shutdown();
  }
  etagCache = null;
};

const parseCacheControlTtl = (
  headers: Record<string, string>,
): number | undefined => {
  const cacheControl = headers['cache-control'] || headers['Cache-Control'];
  if (!cacheControl) return undefined;
  const match = /max-age=(\d+)/.exec(cacheControl);
  return match ? parseInt(match[1], 10) * 1000 : undefined;
};

// --- Composed helper functions ---

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

  if (useETag && method === 'GET' && etagCache) {
    const cachedETag = etagCache.getETag(url);
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
  status: number,
  url: string,
  parsed: ParsedHeaders,
  response: Response,
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
    if (useETag && etagCache) {
      const cachedEntry = etagCache.get(url);
      if (cachedEntry) {
        logInfo(`Cache hit (304) for endpoint: ${url}`);
        return {
          headers: { ...cachedEntry.headers, ...parsed.raw },
          body: cachedEntry.data,
          fromCache: true,
        };
      }
    }
    throw new EsiError(304, 'Not Modified — no cached data available', url);
  }

  return null;
}

function tryStaleCacheResponse(
  url: string,
  parsed: ParsedHeaders,
): EsiHandlerResponse | null {
  if (!etagCache) return null;
  const cachedEntry = etagCache.get(url);
  if (!cachedEntry) return null;
  return {
    headers: { ...cachedEntry.headers, ...parsed.raw },
    body: cachedEntry.data,
    fromCache: true,
    stale: true,
  };
}

function cacheResponse(
  url: string,
  method: string,
  endpoint: string,
  parsed: ParsedHeaders,
  data: unknown,
  useETag: boolean,
): void {
  if (useETag && method === 'GET' && etagCache && parsed.etag) {
    const ttl = parseCacheControlTtl(parsed.raw);
    etagCache.set(url, parsed.etag, data, parsed.raw, ttl);
    const ttlInfo = ttl ? ` (ttl=${ttl}ms)` : '';
    logDebug(`Cached response for ${url} with ETag ${parsed.etag}${ttlInfo}`);
  }

  if (method !== 'GET' && etagCache) {
    etagCache.deleteByPath(endpoint.split('?')[0]);
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
    );

    cacheResponse(url, method, endpoint, parsed, allData, useETag);
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

// --- Main request functions ---

const executeRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
): Promise<EsiHandlerResponse> => {
  const url = `${client.getLink()}/${endpoint}`;
  const headers = buildRequestHeaders(
    client,
    url,
    method,
    requiresAuth,
    useETag,
    body,
  );

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  logInfo(`Hitting endpoint: ${url}`);

  try {
    const rateLimiter = RateLimiter.getInstance();
    await rateLimiter.checkRateLimit();

    const response = await fetch(url, options);
    const parsed = parseHeaders(response.headers);

    rateLimiter.updateFromResponse(parsed.raw, response.status);

    // 201 needs body parsing attempt
    if (response.status === 201) {
      let data: unknown;
      try {
        data = (await response.json()) as unknown;
      } catch {
        data = undefined;
      }
      return { headers: parsed.raw, body: data };
    }

    const earlyResult = handleEarlyStatus(
      response.status,
      url,
      parsed,
      response,
      useETag,
    );
    if (earlyResult) return earlyResult;

    // Handle error statuses (4xx/5xx)
    if (!response.ok) {
      const errorMessage =
        STATUS_MESSAGES[response.status] || response.statusText;

      if (response.status >= 500 && useETag) {
        const staleResult = tryStaleCacheResponse(url, parsed);
        if (staleResult) {
          logWarn(`${errorMessage} for ${url} — serving stale cache`);
          return staleResult;
        }
      }

      if (response.status === 420 || response.status === 429) {
        logWarn(`Rate limited (${response.status}) on ${url}`);
      }

      throw new EsiError(response.status, errorMessage, url);
    }

    const data = await parseJsonBody(response, url);

    cacheResponse(url, method, endpoint, parsed, data, useETag);

    const cursorResult = handleCursorPagination(parsed, data);
    if (cursorResult) return cursorResult;

    return await handleOffsetPagination(
      client,
      endpoint,
      method,
      requiresAuth,
      parsed,
      data,
      body,
      url,
      useETag,
    );
  } catch (error: unknown) {
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
