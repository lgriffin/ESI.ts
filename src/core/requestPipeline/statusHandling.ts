import { ApiClient } from '../ApiClient';
import { EsiError } from '../util/error';
import { logInfo, logWarn, logError } from '../logger/clientLog';
import { ICache } from '../cache/ICache';
import { buildCacheKey } from '../cache/cacheKey';
import { ParsedHeaders } from '../util/headersUtil';
import { CircuitOpenError } from '../circuitBreaker/CircuitBreaker';
import { buildError } from '../util/error';
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
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  520: 'Internal server error, did the request terminate too soon?',
};

/**
 * The text an error status is reported with: the client's own message, else
 * the reason phrase, else `HTTP <status>`. HTTP/2 carries no reason phrase, so
 * `statusText` is empty for any status missing from STATUS_MESSAGES.
 */
export function statusMessage(response: Response): string {
  return (
    STATUS_MESSAGES[response.status] ||
    response.statusText ||
    `HTTP ${response.status}`
  );
}

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
    logInfo(client, `No Content for endpoint: ${url}`, { status });
    return { headers: parsed.raw, body: undefined, status: 204 };
  }

  if (status === 304) {
    const cache = resolveCache(client);
    if (useETag && cache) {
      const key = buildCacheKey(url, client, requiresAuth);
      const cachedEntry = cache.get(key);
      if (cachedEntry) {
        logInfo(client, `Cache hit (304) for endpoint: ${url}`, {
          status,
          cacheHitType: 'etag-304',
        });
        const headers: Record<string, string> = {
          ...cachedEntry.headers,
          ...parsed.raw,
        };
        // The stored ETag names the stored body. A concurrent request may have
        // replaced the entry after this one was sent with an older
        // If-None-Match, so the 304's own ETag can name a body the cache no
        // longer holds and must not overwrite the stored one.
        if ('etag' in parsed.raw) headers['etag'] = cachedEntry.etag;
        // A 304 confirms the stored body is current: store it again so its
        // freshness TTL, and the retention window after it, start over.
        cache.set(
          key,
          cachedEntry.etag,
          cachedEntry.data,
          headers,
          cachedEntry.ttl,
        );
        return {
          headers,
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

const MAX_REASON_LENGTH = 200;

/**
 * The reason ESI gives for an error, from its `{ "error": "..." }` body.
 * Undefined for any other body. Consumes the response body.
 */
export async function readEsiErrorReason(
  response: Response,
): Promise<string | undefined> {
  try {
    const parsed = JSON.parse(await response.text()) as unknown;
    const reason =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as { error?: unknown }).error
        : undefined;
    if (typeof reason !== 'string') return undefined;
    const trimmed = reason.trim();
    return trimmed ? trimmed.slice(0, MAX_REASON_LENGTH) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Handle error HTTP responses (4xx, 5xx). May serve stale cache on 5xx.
 * `esiReason` (see readEsiErrorReason) is appended to the status message.
 */
export function handleErrorResponse(
  client: ApiClient,
  response: Response,
  url: string,
  parsed: ParsedHeaders,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  requiresAuth: boolean = false,
  esiReason?: string,
): EsiHandlerResponse | never {
  const text = statusMessage(response);
  const errorMessage = esiReason ? `${text}: ${esiReason}` : text;

  if (response.status >= 500 && useETag) {
    const staleResult = tryStaleCacheResponse(
      client,
      url,
      parsed,
      resolveCache,
      requiresAuth,
    );
    if (staleResult) {
      logWarn(client, `${errorMessage} for ${url} — serving stale cache`, {
        status: response.status,
      });
      return { ...staleResult, status: response.status };
    }
  }

  if (response.status === 420 || response.status === 429) {
    logWarn(client, `Rate limited (${response.status}) on ${url}`, {
      status: response.status,
    });
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
export function wrapError(error: unknown, client?: ApiClient): never {
  if (error instanceof EsiError || error instanceof CircuitOpenError) {
    throw error;
  }
  if (error instanceof Error) {
    logError(client, `Unexpected error: ${error.message}`);
    throw buildError(error.message, 'ESIJS_ERROR');
  }
  logError(client, `Unexpected error: ${String(error)}`);
  throw buildError(String(error), 'ESIJS_ERROR');
}
