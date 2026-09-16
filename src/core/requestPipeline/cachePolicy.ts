import { ApiClient } from '../ApiClient';
import { logDebug } from '../logger/clientLog';
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
 * How long a cached entry is kept after its freshness TTL elapses. Past the
 * freshness TTL the entry is no longer served without a request, but it still
 * supplies the ETag for an `If-None-Match` revalidation and the body served
 * stale when ESI answers with a 5xx. One hour spans ESI's daily downtime. The
 * cache's `maxEntries` still bounds memory.
 */
const STALE_RETENTION_MS = 60 * 60 * 1000;

/**
 * The lifetime to store an entry for: its freshness TTL plus the stale
 * retention window. Undefined when the response gave no freshness TTL, so the
 * cache applies its own `defaultTtl`.
 */
function retentionTtl(freshnessTtlMs: number | undefined): number | undefined {
  return freshnessTtlMs === undefined
    ? undefined
    : freshnessTtlMs + STALE_RETENTION_MS;
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
      client,
      `Spec-aware cache hit for ${url} (age=${Math.round(age / 1000)}s, ttl=${Math.round(specTtlMs / 1000)}s)`,
      { method, templatePath },
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
    const freshnessTtl = specTtlMs ?? headerTtl;
    const ttl = retentionTtl(freshnessTtl);
    cache.set(key, parsed.etag, data, parsed.raw, ttl);
    const ttlInfo =
      freshnessTtl !== undefined
        ? ` (ttl=${freshnessTtl}ms, kept for ${ttl}ms)`
        : '';
    logDebug(
      client,
      `Cached response for ${url} with ETag ${parsed.etag}${ttlInfo}`,
      {
        method,
        etag: parsed.etag,
      },
    );
  }

  invalidateAfterWrite(client, method, endpoint, resolveCache);
}

/**
 * Evict the cached copy of a response the caller rejected. `executeRequest`
 * caches a GET body before `createClient` validates it, so a body that fails
 * the endpoint's schema would otherwise be served again, from the spec TTL or
 * after a 304, until the entry expired.
 */
export function evictRejectedResponse(
  client: ApiClient,
  endpoint: string,
  requiresAuth: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
): void {
  const cache = resolveCache(client);
  if (!cache) return;
  const url = `${client.getLink()}/${endpoint}`;
  if (cache.delete(buildCacheKey(url, client, requiresAuth))) {
    logDebug(
      client,
      `Evicted cached response for ${url} after it failed validation`,
    );
  }
}

/**
 * Evict cached reads under the endpoint's path after a successful write, so a
 * read that follows a POST/PUT/DELETE fetches rather than serving the
 * pre-write copy. Called for every 2xx status, including the body-less
 * 201/204 replies that return before a response is cached.
 */
export function invalidateAfterWrite(
  client: ApiClient,
  method: string,
  endpoint: string,
  resolveCache: (client: ApiClient) => ICache | null,
): void {
  const cache = resolveCache(client);
  if (method !== 'GET' && cache) {
    cache.deleteByPath(endpoint.split('?')[0]!);
  }
}
