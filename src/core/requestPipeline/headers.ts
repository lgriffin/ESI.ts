import { ApiClient } from '../ApiClient';
import { EsiConfigurationError } from '../util/error';
import { logDebug } from '../logger/clientLog';
import { ICache } from '../cache/ICache';
import { buildConditionalCacheKey } from '../cache/cacheKey';
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

/** Printable ASCII and tab: a header value fetch accepts on every runtime. */
const HEADER_VALUE = /^[\t\x20-\x7e]+$/;

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
  accept: string = 'application/json',
): HeadersInit {
  // A configured userAgent names the application first; the library's own
  // identifier follows, as CCP asks. It was validated when configured.
  const userAgent = client.getUserAgent();
  const headers: HeadersInit = {
    Accept: accept,
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': userAgent ? `${userAgent} ${USER_AGENT}` : USER_AGENT,
    'X-Compatibility-Date': client.getCompatibilityDate() ?? COMPATIBILITY_DATE,
  };

  // ESI reads the caller from X-User-Agent: the configured userAgent, else the
  // clientId (README.md). clientId is free text (config or ESI_CLIENT_ID), and
  // fetch rejects a header value holding a control character, so a clientId
  // that is not a legal header value is left off rather than failing every
  // request.
  const clientId = client.getClientId();
  if (userAgent) {
    headers['X-User-Agent'] = userAgent;
  } else if (HEADER_VALUE.test(clientId)) {
    headers['X-User-Agent'] = clientId;
  }

  const tenant = client.getTenant();
  if (tenant) {
    headers['X-Tenant'] = tenant;
  }

  const language = client.getLanguage();
  if (language) {
    headers['Accept-Language'] = language;
  }

  if (requiresAuth) {
    const authHeader = client.getAuthorizationHeader();
    if (!authHeader) {
      throw new EsiConfigurationError(
        'NO_AUTH_TOKEN',
        [
          'Authorization header is required for this endpoint but no access token is configured',
          'Fix: set ESI_ACCESS_TOKEN in your environment (see .env.example), or call client.setAccessToken(token), or pass accessToken to the EsiClient constructor',
        ].join(' — '),
      );
    }
    headers['Authorization'] = authHeader;
  }

  const cache = resolveCache(client);
  if (useETag && method === 'GET' && cache) {
    // The claimed identity's ETag: for a token ESI has not accepted yet, the
    // 304 this earns is ESI's acceptance, and a 401 serves nothing.
    const key = buildConditionalCacheKey(url, client, requiresAuth);
    const cachedETag = cache.getETag(key);
    if (cachedETag) {
      headers['If-None-Match'] = cachedETag;
      logDebug(client, `Adding If-None-Match header: ${cachedETag}`, {
        etag: cachedETag,
      });
    }
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}
