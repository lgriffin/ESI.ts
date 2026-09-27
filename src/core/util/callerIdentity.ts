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
 * The payload is decoded without verifying the signature. The token is what
 * the client is about to send; ESI decides whether it is genuine, and a
 * forged one earns a 401 rather than another character's cached data, since
 * the cache holds only what ESI answered to a token naming that character.
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

/**
 * The key fragment for an Authorization header: `character:<id>` for an SSO
 * token, else the first 16 hex characters of a SHA-256 of the whole header.
 */
export function callerIdentity(authorizationHeader: string): string {
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : authorizationHeader;
  const characterId = characterIdOfToken(token);
  if (characterId !== null) return `character:${characterId}`;
  return createHash('sha256')
    .update(authorizationHeader)
    .digest('hex')
    .slice(0, 16);
}
