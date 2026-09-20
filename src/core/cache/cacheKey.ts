import { createHash } from 'crypto';
import { ApiClient } from '../ApiClient';

/**
 * Scope a key to the identity whose token the request carries.
 *
 * One client can serve more than one identity: `setAccessToken` and a
 * `tokenProvider` both replace the token in place. A path says nothing about
 * whose data comes back — `characters/{character_id}/online` answers
 * differently for every token that asks it — so any key that outlives a single
 * request has to carry the identity too, or one caller is served another's
 * data.
 *
 * The Authorization header is hashed rather than stored: keys reach logs and
 * diagnostics, and a bearer token should not.
 */
function scopeToIdentity(
  key: string,
  client: ApiClient,
  requiresAuth: boolean,
): string {
  if (!requiresAuth) return key;
  const authHeader = client.getAuthorizationHeader();
  if (!authHeader) return key;
  const hash = createHash('sha256')
    .update(authHeader)
    .digest('hex')
    .slice(0, 16);
  return `${hash}:${key}`;
}

/** The ETag cache key for a request: its URL, scoped to the identity. */
export function buildCacheKey(
  url: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  return scopeToIdentity(url, client, requiresAuth);
}

/**
 * The deduplication key for an in-flight request: its endpoint, scoped to the
 * identity.
 *
 * Coalescing has to draw the same line the cache does. Two concurrent GETs to
 * one authenticated endpoint under different tokens are two different
 * questions, and answering both from one response hands one caller the other
 * identity's data.
 */
export function buildDedupeKey(
  endpoint: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  return scopeToIdentity(endpoint, client, requiresAuth);
}
