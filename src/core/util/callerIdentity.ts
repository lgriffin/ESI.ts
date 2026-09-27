import { createHash } from 'crypto';

/**
 * The identity a bearer token stands for, as a key fragment.
 *
 * An EVE SSO access token is a JWT whose `sub` claim reads
 * `CHARACTER:EVE:<characterId>`. A refresh rotates the token but not the
 * character, so keys that outlive one request (the ETag cache, the in-flight
 * deduplicator) use the character id: the ETags a character has earned
 * survive a refresh, and two tokens for one character share an entry. A
 * token that names no character (an opaque test token, another issuer's
 * token) is keyed by a hash of the header instead, so it still never shares
 * an entry with another token, and the token itself never appears in a key,
 * which reaches logs and statistics.
 *
 * The payload is decoded without verifying the signature, so the character
 * a token names is a claim, not a fact, until ESI has answered a request
 * under it. `src/core/cache/cacheKey.ts` keeps the two apart: a token's
 * claimed identity decides which entry a conditional request revalidates,
 * and only an accepted token is served an entry without ESI's answer.
 * `src/auth/jwt.ts` decodes the same claims for the token manager and throws
 * on malformed input; this reader must not, because a malformed token is a
 * valid (if doomed) identity to key by.
 */

const CHARACTER_SUBJECT = /^CHARACTER:EVE:(\d+)$/;

/** The character id an SSO JWT names, or null for anything else. */
export function characterIdOfToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof claims !== 'object' || claims === null) return null;
  const sub = (claims as { sub?: unknown }).sub;
  const match = typeof sub === 'string' ? CHARACTER_SUBJECT.exec(sub) : null;
  return match ? Number(match[1]) : null;
}

/** The first 16 hex characters of a SHA-256 of the whole header. */
export function hashedIdentity(authorizationHeader: string): string {
  return createHash('sha256')
    .update(authorizationHeader)
    .digest('hex')
    .slice(0, 16);
}

/**
 * The identity an Authorization header claims: `character:<id>` for an SSO
 * token, else its hash.
 */
export function callerIdentity(authorizationHeader: string): string {
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : authorizationHeader;
  const characterId = characterIdOfToken(token);
  if (characterId !== null) return `character:${characterId}`;
  return hashedIdentity(authorizationHeader);
}
