import { ApiClient } from '../ApiClient';
import { logDebug } from '../logger/loggerUtil';
import { ICache } from '../cache/ICache';
import { buildCacheKey } from '../cache/cacheKey';
import { ParsedHeaders } from '../util/headersUtil';
import { camelToSnake } from '../util/stringUtil';
import { esiCacheTtls } from '../endpoints/esi-cache-ttls.generated';
import { parseCacheControlTtl } from './headers';

export interface EsiHandlerResponse {
  headers: Record<string, string>;
  body: unknown;
  status?: number;
  fromCache?: boolean;
  stale?: boolean;
  cacheHitType?: 'spec-ttl' | 'etag-304' | 'stale-on-error';
  responseTimeMs?: number;
  cursors?: import('../pagination/CursorPaginationHandler').CursorTokens;
}

/**
 * Look up the spec-defined cache TTL for a given method + template path.
 * Returns TTL in milliseconds, or undefined if not found.
 */
export function lookupSpecTtl(
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

/**
 * Attempt a spec-aware cache hit (TTL-based, no network request).
 */
export function trySpecAwareCacheHit(
  client: ApiClient,
  url: string,
  method: string,
  templatePath: string | undefined,
  resolveCache: (client: ApiClient) => ICache | null,
  requiresAuth: boolean = false,
): EsiHandlerResponse | null {
  if (method !== 'GET' || !templatePath) return null;
  const specTtlMs = lookupSpecTtl(method, templatePath);
  if (!specTtlMs) return null;
  const cache = resolveCache(client);
  if (!cache) return null;
  const key = buildCacheKey(url, client, requiresAuth);
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age < specTtlMs) {
    logDebug(
      `Spec-aware cache hit for ${url} (age=${Math.round(age / 1000)}s, ttl=${Math.round(specTtlMs / 1000)}s)`,
    );
    return {
      headers: entry.headers,
      body: entry.data,
      status: 200,
      fromCache: true,
      cacheHitType: 'spec-ttl',
    };
  }
  return null;
}

/**
 * Attempt to return a stale cached response (used on server errors).
 */
export function tryStaleCacheResponse(
  client: ApiClient,
  url: string,
  parsed: ParsedHeaders,
  resolveCache: (client: ApiClient) => ICache | null,
  requiresAuth: boolean = false,
): EsiHandlerResponse | null {
  const cache = resolveCache(client);
  if (!cache) return null;
  const key = buildCacheKey(url, client, requiresAuth);
  const cachedEntry = cache.get(key);
  if (!cachedEntry) return null;
  return {
    headers: { ...cachedEntry.headers, ...parsed.raw },
    body: cachedEntry.data,
    status: 200,
    fromCache: true,
    stale: true,
    cacheHitType: 'stale-on-error',
  };
}

/**
 * Cache a successful response, or invalidate cache for non-GET methods.
 */
export function cacheResponse(
  client: ApiClient,
  url: string,
  method: string,
  endpoint: string,
  parsed: ParsedHeaders,
  data: unknown,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  templatePath?: string,
  requiresAuth: boolean = false,
): void {
  const cache = resolveCache(client);
  if (useETag && method === 'GET' && cache && parsed.etag) {
    const key = buildCacheKey(url, client, requiresAuth);
    const headerTtl = parseCacheControlTtl(parsed.raw);
    const specTtlMs = templatePath
      ? lookupSpecTtl(method, templatePath)
      : undefined;
    const ttl = specTtlMs ?? headerTtl;
    cache.set(key, parsed.etag, data, parsed.raw, ttl);
    const ttlInfo = ttl ? ` (ttl=${ttl}ms)` : '';
    logDebug(`Cached response for ${url} with ETag ${parsed.etag}${ttlInfo}`);
  }

  if (method !== 'GET' && cache) {
    cache.deleteByPath(endpoint.split('?')[0]!);
  }
}
