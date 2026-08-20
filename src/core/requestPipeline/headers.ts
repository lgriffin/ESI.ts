import { ApiClient } from '../ApiClient';
import { buildError } from '../util/error';
import { logDebug } from '../logger/loggerUtil';
import { ICache } from '../cache/ICache';
import { buildCacheKey } from '../cache/cacheKey';
import { USER_AGENT, COMPATIBILITY_DATE } from '../constants';

/**
 * Parse Cache-Control header to extract max-age TTL in milliseconds.
 */
export const parseCacheControlTtl = (
  headers: Record<string, string>,
): number | undefined => {
  const cacheControl = headers['cache-control'] ?? headers['Cache-Control'];
  if (!cacheControl) return undefined;
  const match = /max-age=(\d+)/.exec(cacheControl);
  return match ? parseInt(match[1]!, 10) * 1000 : undefined;
};

/**
 * Build the request headers for an ESI API call.
 */
export function buildRequestHeaders(
  client: ApiClient,
  url: string,
  method: string,
  requiresAuth: boolean,
  useETag: boolean,
  body: unknown,
  resolveCache: (client: ApiClient) => ICache | null,
): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': USER_AGENT,
    'X-Compatibility-Date': client.getCompatibilityDate() ?? COMPATIBILITY_DATE,
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
    const key = buildCacheKey(url, client);
    const cachedETag = cache.getETag(key);
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
