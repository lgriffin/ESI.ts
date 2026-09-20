import { TokenDecodeError } from './errors';

/** Claims EVE SSO places in an access token. Only the ones the manager reads are typed. */
export interface EveJwtClaims {
  /** `CHARACTER:EVE:<characterId>` */
  sub: string;
  /** Character name. */
  name?: string;
  /** Granted scopes: a single string, or an array when more than one. */
  scp?: string | string[];
  /** Expiry as epoch seconds. */
  exp?: number;
  /** Issued-at as epoch seconds. */
  iat?: number;
  /** Owner hash; changes on character transfer. */
  owner?: string;
  iss?: string;
  aud?: string | string[];
  [claim: string]: unknown;
}

/** Identity and lifetime information extracted from an EVE SSO access token. */
export interface DecodedAccessToken {
  characterId: number;
  characterName: string;
  scopes: string[];
  /** Epoch milliseconds, or undefined when the token carries no `exp`. */
  expiresAt?: number;
  ownerHash?: string;
  claims: EveJwtClaims;
}

function base64UrlDecode(segment: string): string {
  return Buffer.from(segment, 'base64url').toString('utf8');
}

/**
 * Decode the payload of a JWT without verifying its signature.
 *
 * Tokens reach the manager directly from SSO over TLS, so the payload is
 * trusted for the purpose of learning which character it belongs to. Do not
 * use this to authenticate tokens presented by third parties.
 */
export function decodeJwtPayload(token: string): EveJwtClaims {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    throw new TokenDecodeError(
      'Access token is not a JWT (expected three dot-separated segments)',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    throw new TokenDecodeError('Access token payload is not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new TokenDecodeError('Access token payload is not an object');
  }
  return parsed as EveJwtClaims;
}

/** Parse the character id out of an SSO `sub` claim (`CHARACTER:EVE:123`). */
export function parseCharacterId(sub: unknown): number {
  if (typeof sub !== 'string') {
    throw new TokenDecodeError('Access token has no sub claim');
  }
  const match = /^CHARACTER:EVE:(\d+)$/.exec(sub);
  if (!match) {
    throw new TokenDecodeError(
      `Access token sub claim is not a character subject: ${sub}`,
    );
  }
  return Number(match[1]);
}

/** Normalise the `scp` claim, which SSO emits as a string for one scope and an array otherwise. */
export function parseScopes(scp: unknown): string[] {
  if (Array.isArray(scp)) {
    return scp.filter((s): s is string => typeof s === 'string');
  }
  if (typeof scp === 'string') {
    return scp.split(' ').filter((s) => s.length > 0);
  }
  return [];
}

/** Decode an EVE SSO access token into the fields the token manager stores. */
export function decodeAccessToken(token: string): DecodedAccessToken {
  const claims = decodeJwtPayload(token);
  const characterId = parseCharacterId(claims.sub);
  return {
    characterId,
    characterName: typeof claims.name === 'string' ? claims.name : '',
    scopes: parseScopes(claims.scp),
    expiresAt: typeof claims.exp === 'number' ? claims.exp * 1000 : undefined,
    ownerHash: typeof claims.owner === 'string' ? claims.owner : undefined,
    claims,
  };
}
