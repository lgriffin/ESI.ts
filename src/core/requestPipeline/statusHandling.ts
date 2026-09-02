import { ApiClient } from '../ApiClient';
import { EsiError } from '../util/error';
import { logInfo, logWarn } from '../logger/loggerUtil';
import { ICache } from '../cache/ICache';
import { buildCacheKey } from '../cache/cacheKey';
import { ParsedHeaders } from '../util/headersUtil';
import { CircuitOpenError } from '../circuitBreaker/CircuitBreaker';
import { buildError } from '../util/error';
import { logError } from '../logger/loggerUtil';
import { tryStaleCacheResponse, EsiHandlerResponse } from './cachePolicy';

export const STATUS_MESSAGES: Record<number, string> = {
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

/**
 * Handle early-return HTTP statuses (201, 204, 304).
 */
export function handleEarlyStatus(
  client: ApiClient,
  status: number,
  url: string,
  parsed: ParsedHeaders,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  requiresAuth: boolean = false,
): EsiHandlerResponse | null {
  if (status === 201) {
    return { headers: parsed.raw, body: undefined, status: 201 };
  }

  if (status === 204) {
    logInfo(`No Content for endpoint: ${url}`);
    return { headers: parsed.raw, body: undefined, status: 204 };
  }

  if (status === 304) {
    const cache = resolveCache(client);
    if (useETag && cache) {
      const key = buildCacheKey(url, client, requiresAuth);
      const cachedEntry = cache.get(key);
      if (cachedEntry) {
        logInfo(`Cache hit (304) for endpoint: ${url}`);
        return {
          headers: { ...cachedEntry.headers, ...parsed.raw },
          body: cachedEntry.data,
          status: 304,
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

/**
 * Handle error HTTP responses (4xx, 5xx). May serve stale cache on 5xx.
 */
export function handleErrorResponse(
  client: ApiClient,
  response: Response,
  url: string,
  parsed: ParsedHeaders,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  requiresAuth: boolean = false,
): EsiHandlerResponse | never {
  const errorMessage = STATUS_MESSAGES[response.status] || response.statusText;

  if (response.status >= 500 && useETag) {
    const staleResult = tryStaleCacheResponse(
      client,
      url,
      parsed,
      resolveCache,
      requiresAuth,
    );
    if (staleResult) {
      logWarn(`${errorMessage} for ${url} — serving stale cache`);
      return { ...staleResult, status: response.status };
    }
  }

  if (response.status === 420 || response.status === 429) {
    logWarn(`Rate limited (${response.status}) on ${url}`);
  }

  let message = errorMessage;
  if (response.status === 401) {
    message = `${errorMessage} — the access token was missing, expired, or lacks the required ESI scope. Fix: verify ESI_ACCESS_TOKEN, or configure onTokenRefresh for automatic refresh on 401`;
  } else if (response.status === 403) {
    message = `${errorMessage} — your access token does not have the OAuth scopes required for this endpoint. Check the scopes on your EVE SSO application`;
  }

  throw new EsiError(
    response.status,
    message,
    url,
    parsed.requestId ?? undefined,
  );
}

/**
 * Wrap an unknown error into an EsiError or rethrow known errors.
 */
export function wrapError(error: unknown): never {
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
