import { ApiClient } from './ApiClient';
import { buildError, EsiError } from '../core/util/error';
import {
  logInfo,
  logWarn,
  logError,
  logDebug,
} from '../core/logger/loggerUtil';
import HeadersUtil from '../core/util/headersUtil';
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

const statusHandlers: Record<number, string> = {
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

/**
 * Parse max-age from Cache-Control header, returns TTL in milliseconds or undefined
 */
const parseCacheControlTtl = (
  headers: Record<string, string>,
): number | undefined => {
  const cacheControl = headers['cache-control'] || headers['Cache-Control'];
  if (!cacheControl) return undefined;
  const match = /max-age=(\d+)/.exec(cacheControl);
  return match ? parseInt(match[1], 10) * 1000 : undefined;
};

/* eslint-disable sonarjs/cognitive-complexity */
const executeRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
): Promise<EsiHandlerResponse> => {
  const url = `${client.getLink()}/${endpoint}`;
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

  // Add ETag support for GET requests
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

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  logInfo(`Hitting endpoint: ${url}`);

  try {
    // Check rate limit before making the request
    const rateLimiter = RateLimiter.getInstance();
    await rateLimiter.checkRateLimit();

    // Fetch the first page (page 1)
    const response = await fetch(url, options);
    const responseHeaders = HeadersUtil.extractHeaders(response.headers);

    // Update rate limiter with response headers and status code on EVERY response
    rateLimiter.updateFromResponse(responseHeaders, response.status);

    // Handle special success statuses
    if (response.status === 201) {
      let data: unknown;
      try {
        data = (await response.json()) as unknown;
      } catch {
        data = undefined;
      }
      return { headers: responseHeaders, body: data };
    }

    if (response.status === 204) {
      logInfo(`No Content for endpoint: ${url}`);
      return { headers: responseHeaders, body: undefined };
    }

    if (response.status === 304) {
      if (useETag && etagCache) {
        const cachedEntry = etagCache.get(url);
        if (cachedEntry) {
          logInfo(`Cache hit (304) for endpoint: ${url}`);
          return {
            headers: { ...cachedEntry.headers, ...responseHeaders },
            body: cachedEntry.data,
            fromCache: true,
          };
        }
      }
      throw new EsiError(304, 'Not Modified — no cached data available', url);
    }

    // Handle 420/429 rate limiting errors
    if (response.status === 420 || response.status === 429) {
      const errorMessage =
        statusHandlers[response.status] || response.statusText;
      logWarn(`Rate limited (${response.status}) on ${url}`);
      throw new EsiError(response.status, errorMessage, url);
    }

    // Handle other errors (4xx/5xx)
    if (!response.ok) {
      const errorMessage =
        statusHandlers[response.status] || response.statusText;

      // On 5xx, serve stale cached data if available
      if (response.status >= 500 && useETag && etagCache) {
        const cachedEntry = etagCache.get(url);
        if (cachedEntry) {
          logWarn(`${errorMessage} for ${url} — serving stale cache`);
          return {
            headers: { ...cachedEntry.headers, ...responseHeaders },
            body: cachedEntry.data,
            fromCache: true,
            stale: true,
          };
        }
      }

      throw new EsiError(response.status, errorMessage, url);
    }

    // Get the data and number of pages from the first response
    let data: unknown;
    try {
      data = (await response.json()) as unknown;
    } catch (jsonError) {
      const msg =
        jsonError instanceof Error ? jsonError.message : String(jsonError);
      logError(`Failed to parse JSON response: ${msg}`);
      throw buildError(`Invalid JSON response: ${msg}`, 'JSON_PARSE_ERROR');
    }

    // Cache the response if ETag is present and this is a GET request
    if (useETag && method === 'GET' && etagCache && HeadersUtil.etag) {
      const ttl = parseCacheControlTtl(responseHeaders);
      etagCache.set(url, HeadersUtil.etag, data, responseHeaders, ttl);
      const ttlInfo = ttl ? ` (ttl=${ttl}ms)` : '';
      logDebug(
        `Cached response for ${url} with ETag ${HeadersUtil.etag}${ttlInfo}`,
      );
    }

    // Invalidate related GET caches on write operations
    if (method !== 'GET' && etagCache) {
      etagCache.deleteByPath(endpoint.split('?')[0]);
    }

    // --- Cursor-based pagination ---
    if (HeadersUtil.hasCursorPagination) {
      const cursors: CursorTokens = {
        before: HeadersUtil.cursorBefore,
        after: HeadersUtil.cursorAfter,
      };

      return { headers: responseHeaders, body: data, cursors };
    }

    // --- Offset-based pagination ---
    const totalPages = HeadersUtil.xPages;

    // If there's only one page, return the data immediately
    if (totalPages <= 1) {
      return { headers: responseHeaders, body: data };
    }

    // Fetch remaining pages (2..totalPages), reusing page 1 data we already have
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

      // Cache the complete paginated response if ETag is present
      if (useETag && method === 'GET' && etagCache && HeadersUtil.etag) {
        const ttl = parseCacheControlTtl(responseHeaders);
        etagCache.set(url, HeadersUtil.etag, allData, responseHeaders, ttl);
        logDebug(
          `Cached paginated response for ${url} with ETag ${HeadersUtil.etag}`,
        );
      }

      return { headers: responseHeaders, body: allData };
    } catch (paginationError: unknown) {
      const msg =
        paginationError instanceof Error
          ? paginationError.message
          : String(paginationError);
      logWarn(`Pagination failed, returning first page only: ${msg}`);
      return { headers: responseHeaders, body: data };
    }
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
/* eslint-enable sonarjs/cognitive-complexity */
