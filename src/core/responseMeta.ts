/**
 * What one ESI response says about itself beyond its body: the caching,
 * paging and error-budget headers, and whether the cache answered. The legacy
 * `withMetadata()` clients and the shared runtime's metadata views
 * (`esi.withMetadata()`) both build it here, from the pipeline's response.
 */
import type { EsiHandlerResponse } from './requestPipeline/cachePolicy';
import { parseWarning } from './util/headersUtil';

/** The `X-Ratelimit-*` headers of a rate-limited route. */
export type ResponseRateLimit = {
  readonly remaining: number;
  readonly limit: number;
  readonly used: number;
  /** The route's group, from `X-Ratelimit-Group`; null when ESI named none. */
  readonly group: string | null;
};

/**
 * One response's metadata. A type alias rather than an interface, so it is
 * assignable to the legacy `EsiResponseMeta`, whose schema allows extra keys.
 */
export type ResponseMeta = {
  /** Every response header, names lower-cased. */
  readonly headers: Readonly<Record<string, string>>;
  /** The answer came from the ETag cache, not from a 200 over the wire. */
  readonly fromCache: boolean;
  /** The cached answer was served past its freshness because ESI failed. */
  readonly stale: boolean;
  /** How the cache answered: within the spec TTL, after a 304, or stale on error. */
  readonly cacheHitType?: 'spec-ttl' | 'etag-304' | 'stale-on-error';
  /** The parsed `Warning` header (ESI announces a route's deprecation with 199 or 299). */
  readonly warning?: { readonly code: number; readonly message: string };
  readonly requestId?: string;
  readonly date?: string;
  readonly contentLanguage?: string;
  readonly rateLimit?: ResponseRateLimit;
  /** Milliseconds from sending the request to reading the response. */
  readonly responseTimeMs?: number;
  readonly etag?: string;
  /** `X-Pages`: how many pages the collection has. */
  readonly pages?: number;
  readonly expires?: string;
  /** `X-Esi-Error-Limit-Remain`: errors left in the current window. */
  readonly errorLimitRemain?: number;
  /** `X-Esi-Error-Limit-Reset`: seconds until the error window resets. */
  readonly errorLimitReset?: number;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** Reads a pipeline response's headers into its metadata. */
export function buildResponseMeta(response: EsiHandlerResponse): ResponseMeta {
  const headers = response.headers;
  const meta: Mutable<ResponseMeta> = {
    headers,
    fromCache: response.fromCache ?? false,
    stale: response.stale ?? false,
  };
  if (response.cacheHitType) meta.cacheHitType = response.cacheHitType;
  if (response.responseTimeMs !== undefined)
    meta.responseTimeMs = response.responseTimeMs;
  const w = parseWarning(headers['warning']);
  if (w) meta.warning = w;
  if (headers['x-esi-request-id']) meta.requestId = headers['x-esi-request-id'];
  if (headers['date']) meta.date = headers['date'];
  if (headers['content-language'])
    meta.contentLanguage = headers['content-language'];
  if (headers['x-ratelimit-remaining']) {
    meta.rateLimit = {
      remaining: parseInt(headers['x-ratelimit-remaining'], 10),
      limit: parseInt(headers['x-ratelimit-limit'] ?? '0', 10),
      used: parseInt(headers['x-ratelimit-used'] ?? '0', 10),
      group: headers['x-ratelimit-group'] ?? null,
    };
  }
  if (headers['etag']) meta.etag = headers['etag'];
  if (headers['x-pages']) meta.pages = parseInt(headers['x-pages'], 10);
  if (headers['expires']) meta.expires = headers['expires'];
  if (headers['x-esi-error-limit-remain'])
    meta.errorLimitRemain = parseInt(headers['x-esi-error-limit-remain'], 10);
  if (headers['x-esi-error-limit-reset'])
    meta.errorLimitReset = parseInt(headers['x-esi-error-limit-reset'], 10);
  return meta;
}
