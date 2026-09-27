import { ApiClient } from '../ApiClient';
import { callerIdentity, hashedIdentity } from '../util/callerIdentity';

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
 *
 * The character is read from the token without verifying it, so it is a
 * claim until ESI has answered a request under that token. A token ESI has
 * not yet accepted is keyed by its hash wherever an entry would be served
 * without ESI's say (the spec-TTL hit, stale-on-error, joining an in-flight
 * request), and by its claimed character only for the `If-None-Match` it
 * sends: a 304 is ESI accepting the token and the entry in one answer, and a
 * 401 serves nothing. Without this, a forged token naming a character would
 * read that character's cache before ESI ever saw it.
 */

interface Identity {
  header: string;
  /** `character:<id>` for an SSO token, else the hash. */
  claimed: string;
  hashed: string;
}

/**
 * Derived once per token per client, not once per request: decoding a JWT on
 * every cache lookup would put base64 and JSON parsing on the hot path, and a
 * client keeps one token for thousands of requests.
 */
const identities = new WeakMap<ApiClient, Identity>();

/** Hashes of the headers ESI has answered 2xx or 304 to, per client. */
const accepted = new WeakMap<ApiClient, Set<string>>();

/** Refreshes are rare; a flood of rejected tokens costs nothing here. */
const ACCEPTED_LIMIT = 64;

function identityOf(client: ApiClient, header: string): Identity {
  const known = identities.get(client);
  if (known && known.header === header) return known;
  const identity = {
    header,
    claimed: callerIdentity(header),
    hashed: hashedIdentity(header),
  };
  identities.set(client, identity);
  return identity;
}

/**
 * Record that ESI accepted the token in `authorizationHeader`, so its claimed
 * character now keys what the client serves without a request. Called with
 * the header the request carried, not the client's current one: a refresh
 * may have replaced the token while the request was in flight.
 */
export function markTokenAccepted(
  client: ApiClient,
  authorizationHeader: string,
): void {
  let set = accepted.get(client);
  if (!set) {
    set = new Set();
    accepted.set(client, set);
  }
  const hashed = hashedIdentity(authorizationHeader);
  if (set.has(hashed)) return;
  if (set.size >= ACCEPTED_LIMIT) {
    set.delete(set.values().next().value as string);
  }
  set.add(hashed);
}

function isAccepted(client: ApiClient, identity: Identity): boolean {
  return accepted.get(client)?.has(identity.hashed) ?? false;
}

function scope(key: string, identity: string | null): string {
  return identity === null ? key : `${identity}:${key}`;
}

/**
 * The identity that decides what the client serves without asking ESI: the
 * one in `authorizationHeader` when given, else the client's current token.
 */
function trustedIdentity(
  client: ApiClient,
  requiresAuth: boolean,
  authorizationHeader?: string,
): string | null {
  if (!requiresAuth) return null;
  const header = authorizationHeader ?? client.getAuthorizationHeader();
  if (!header) return null;
  const identity = identityOf(client, header);
  return isAccepted(client, identity) ? identity.claimed : identity.hashed;
}

/** The identity the token claims, whether or not ESI has accepted it yet. */
function claimedIdentity(
  client: ApiClient,
  requiresAuth: boolean,
): string | null {
  if (!requiresAuth) return null;
  const header = client.getAuthorizationHeader();
  if (!header) return null;
  return identityOf(client, header).claimed;
}

/**
 * The ETag cache key for a request: its URL, scoped to the identity ESI has
 * accepted. Reads that serve an entry without a request, and writes of what
 * ESI answered, use this key.
 *
 * Once a request has been sent, `authorizationHeader` is the header it
 * carried: a concurrent request may have replaced the client's token in the
 * meantime, and what ESI answered belongs to the token that asked, not to
 * the one the client holds when the answer arrives.
 */
export function buildCacheKey(
  url: string,
  client: ApiClient,
  requiresAuth: boolean = false,
  authorizationHeader?: string,
): string {
  return scope(url, trustedIdentity(client, requiresAuth, authorizationHeader));
}

/**
 * The key whose ETag a request sends as `If-None-Match`: the URL scoped to
 * the identity the token claims. Sending the character's ETag under a token
 * ESI has not yet accepted serves nothing by itself; ESI's 304 is what serves
 * the entry, and it comes only to a token ESI accepts.
 */
export function buildConditionalCacheKey(
  url: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  return scope(url, claimedIdentity(client, requiresAuth));
}

/**
 * The deduplication key for an in-flight request: its endpoint, scoped to the
 * accepted identity.
 *
 * Coalescing has to draw the same line the cache does. Two concurrent GETs to
 * one authenticated endpoint under tokens for different characters are two
 * different questions, and answering both from one response hands one caller
 * the other identity's data. Under two accepted tokens for one character they
 * are one question, and share the request; a token ESI has not yet accepted
 * joins nothing, since joining is being served without ESI's answer.
 */
export function buildDedupeKey(
  endpoint: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  return scope(endpoint, trustedIdentity(client, requiresAuth));
}
