import { ApiClient } from '../ApiClient';
import { callerIdentity } from '../util/callerIdentity';

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
 * The identity is the character an EVE SSO token names, so a refreshed token
 * keeps the character's entries, or a hash of the header for a token that
 * names none (`callerIdentity`). Either way the bearer token itself never
 * appears in a key: keys reach logs and diagnostics.
 */
function scopeToIdentity(
  key: string,
  client: ApiClient,
  requiresAuth: boolean,
): string {
  if (!requiresAuth) return key;
  const authHeader = client.getAuthorizationHeader();
  if (!authHeader) return key;
  return `${identityOf(client, authHeader)}:${key}`;
}

/**
 * The identity is derived once per token per client, not once per request:
 * decoding a JWT on every cache lookup would put base64 and JSON parsing on
 * the hot path, and a client keeps one token for thousands of requests.
 */
const identities = new WeakMap<
  ApiClient,
  { header: string; identity: string }
>();

function identityOf(client: ApiClient, authHeader: string): string {
  const known = identities.get(client);
  if (known && known.header === authHeader) return known.identity;
  const identity = callerIdentity(authHeader);
  identities.set(client, { header: authHeader, identity });
  return identity;
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
 * one authenticated endpoint under tokens for different characters are two
 * different questions, and answering both from one response hands one caller
 * the other identity's data. Under two tokens for one character they are one
 * question, and share the request.
 */
export function buildDedupeKey(
  endpoint: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  return scopeToIdentity(endpoint, client, requiresAuth);
}
