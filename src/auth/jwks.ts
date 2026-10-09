import { createPublicKey, KeyObject, verify } from 'crypto';
import type { FetchLike } from '../core/ApiClient';
import { systemClock } from '../core/clock';
import { TokenVerificationError } from './errors';
import { decodeAccessToken, DecodedAccessToken, EveJwtClaims } from './jwt';

/** EVE SSO's published signing keys. */
export const DEFAULT_SSO_JWKS_URL = 'https://login.eveonline.com/oauth/jwks';

/** Issuer values EVE SSO puts in `iss`; both forms are in circulation. */
const SSO_ISSUERS: readonly string[] = [
  'login.eveonline.com',
  'https://login.eveonline.com',
];

/** The audience every EVE SSO access token carries next to the client id. */
const SSO_AUDIENCE = 'EVE Online';

const USER_AGENT = '@lgriffin/esi.ts (+https://github.com/lgriffin/ESI.ts)';

export interface SsoJwksOptions {
  /** Key set URL. Defaults to {@link DEFAULT_SSO_JWKS_URL}. */
  jwksUrl?: string | undefined;
  /** Custom fetch. Defaults to `globalThis.fetch` resolved at call time. */
  fetch?: FetchLike | undefined;
  /** How long a fetched key set is reused, in milliseconds. Defaults to one hour. */
  cacheTtlMs?: number | undefined;
  /**
   * Minimum gap between two fetches triggered by an unknown `kid`, in
   * milliseconds, so made-up key ids cannot hammer SSO. Defaults to one minute.
   */
  refetchCooldownMs?: number | undefined;
  /** Clock override for tests, epoch milliseconds. */
  now?: (() => number) | undefined;
}

interface RsaJsonWebKey {
  kty: 'RSA';
  kid: string;
  n: string;
  e: string;
  alg?: 'RS256';
}

/**
 * Fetches and caches EVE SSO's JSON Web Key Set. The set is reused for
 * `cacheTtlMs`; a `kid` missing from the cached set triggers one refetch,
 * at most once per `refetchCooldownMs`. Concurrent fetches share one request.
 *
 * Share one instance across verifications; a fresh instance fetches the key
 * set on its first use.
 */
export class SsoJwks {
  private readonly jwksUrl: string;
  private readonly fetchFn?: FetchLike | undefined;
  private readonly cacheTtlMs: number;
  private readonly refetchCooldownMs: number;
  private readonly now: () => number;
  private keys = new Map<string, KeyObject>();
  private fetchedAt: number | undefined;
  private pending: Promise<void> | undefined;

  constructor(options: SsoJwksOptions = {}) {
    this.jwksUrl = options.jwksUrl ?? DEFAULT_SSO_JWKS_URL;
    this.fetchFn = options.fetch;
    this.cacheTtlMs = options.cacheTtlMs ?? 60 * 60_000;
    this.refetchCooldownMs = options.refetchCooldownMs ?? 60_000;
    this.now = options.now ?? (() => systemClock.now());
  }

  /**
   * The RS256 public key for `kid`.
   *
   * @throws TokenVerificationError `unknown-key` when the key set lacks `kid`
   *   after any refetch it allows, `jwks-unavailable` when it cannot be fetched
   */
  async getKey(kid: string): Promise<KeyObject> {
    if (this.fetchedAt === undefined || this.isExpired()) {
      await this.refresh();
    }
    let key = this.keys.get(kid);
    if (!key && this.canRefetch()) {
      await this.refresh();
      key = this.keys.get(kid);
    }
    if (!key) {
      throw new TokenVerificationError(
        'unknown-key',
        `EVE SSO's key set has no RS256 key with kid ${kid}`,
      );
    }
    return key;
  }

  private isExpired(): boolean {
    return this.now() - (this.fetchedAt ?? 0) >= this.cacheTtlMs;
  }

  private canRefetch(): boolean {
    return this.now() - (this.fetchedAt ?? 0) >= this.refetchCooldownMs;
  }

  private refresh(): Promise<void> {
    this.pending ??= this.load().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async load(): Promise<void> {
    const fetchFn = this.fetchFn ?? globalThis.fetch;
    let body: unknown;
    try {
      const response = await fetchFn(this.jwksUrl, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      body = await response.json();
    } catch (err: unknown) {
      throw new TokenVerificationError(
        'jwks-unavailable',
        `Could not fetch EVE SSO's key set from ${this.jwksUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    const keys = parseKeySet(body);
    if (keys.size === 0) {
      throw new TokenVerificationError(
        'jwks-unavailable',
        `EVE SSO's key set at ${this.jwksUrl} holds no RS256 keys`,
      );
    }
    this.keys = keys;
    this.fetchedAt = this.now();
  }
}

/** The RSA signing keys of a JWKS document, by `kid`. Other key types are skipped. */
function parseKeySet(body: unknown): Map<string, KeyObject> {
  const keys = new Map<string, KeyObject>();
  if (typeof body !== 'object' || body === null) return keys;
  const list = (body as { keys?: unknown }).keys;
  if (!Array.isArray(list)) return keys;
  for (const entry of list as unknown[]) {
    if (!isRs256Jwk(entry)) continue;
    try {
      keys.set(
        entry.kid,
        createPublicKey({
          key: { kty: 'RSA', n: entry.n, e: entry.e },
          format: 'jwk',
        }),
      );
    } catch {
      // A key Node cannot import cannot verify anything; skip it.
    }
  }
  return keys;
}

/** True for an RSA key with a kid, a modulus and an exponent, marked RS256 or unmarked. */
function isRs256Jwk(entry: unknown): entry is RsaJsonWebKey {
  if (typeof entry !== 'object' || entry === null) return false;
  const jwk = entry as Record<string, unknown>;
  return (
    jwk['kty'] === 'RSA' &&
    typeof jwk['kid'] === 'string' &&
    typeof jwk['n'] === 'string' &&
    jwk['n'] !== '' &&
    typeof jwk['e'] === 'string' &&
    jwk['e'] !== '' &&
    (jwk['alg'] === undefined || jwk['alg'] === 'RS256')
  );
}

export interface VerifyAccessTokenOptions {
  /** The application's SSO client id; the `aud` claim must contain it. */
  clientId: string;
  /**
   * Key set cache to verify against. Pass one shared instance so keys are
   * fetched once, not per call. Defaults to a new {@link SsoJwks} built from
   * `fetch` and `now`.
   */
  jwks?: SsoJwks | undefined;
  /** Custom fetch for the key set when `jwks` is not given. */
  fetch?: FetchLike | undefined;
  /** Seconds of clock difference allowed when checking `exp`. Defaults to 0. */
  clockToleranceSeconds?: number | undefined;
  /** Clock override for tests, epoch milliseconds. */
  now?: (() => number) | undefined;
}

/**
 * Verify an EVE SSO access token and decode it.
 *
 * Checks, in order: the token is a JWT whose header names RS256 and a `kid`;
 * the signature verifies against that key from EVE SSO's JWKS; `iss` is EVE
 * SSO; `aud` contains `clientId` and `EVE Online`; `exp` is in the future.
 * Use this, not {@link decodeAccessToken}, for a token a third party hands
 * you.
 *
 * @throws TokenVerificationError naming the check that failed
 */
export async function verifyAccessToken(
  token: string,
  options: VerifyAccessTokenOptions,
): Promise<DecodedAccessToken> {
  const now = options.now ?? (() => systemClock.now());
  const jwks =
    options.jwks ?? new SsoJwks({ fetch: options.fetch, now: options.now });
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new TokenVerificationError(
      'malformed',
      'Access token is not a JWT (expected three dot-separated segments)',
    );
  }
  const [headerSegment, payloadSegment, signatureSegment] = parts as [
    string,
    string,
    string,
  ];
  const header = parseSegment(headerSegment, 'header');
  if (header['alg'] !== 'RS256') {
    throw new TokenVerificationError(
      'algorithm',
      `Access token algorithm ${String(header['alg'])} is not RS256`,
    );
  }
  const kid = header['kid'];
  if (typeof kid !== 'string') {
    throw new TokenVerificationError(
      'malformed',
      'Access token header has no kid',
    );
  }
  const key = await jwks.getKey(kid);
  const signed = verify(
    'RSA-SHA256',
    Buffer.from(`${headerSegment}.${payloadSegment}`),
    key,
    Buffer.from(signatureSegment, 'base64url'),
  );
  if (!signed) {
    throw new TokenVerificationError(
      'signature',
      'Access token signature does not match its header and payload',
    );
  }
  const claims = parseSegment(payloadSegment, 'payload') as EveJwtClaims;
  checkClaims(claims, options.clientId, now(), options.clockToleranceSeconds);
  try {
    return decodeAccessToken(token);
  } catch (err: unknown) {
    throw new TokenVerificationError(
      'malformed',
      err instanceof Error ? err.message : String(err),
    );
  }
}

function parseSegment(
  segment: string,
  name: 'header' | 'payload',
): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new TokenVerificationError(
      'malformed',
      `Access token ${name} is not valid JSON`,
    );
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TokenVerificationError(
      'malformed',
      `Access token ${name} is not an object`,
    );
  }
  return parsed as Record<string, unknown>;
}

function checkClaims(
  claims: EveJwtClaims,
  clientId: string,
  nowMs: number,
  clockToleranceSeconds = 0,
): void {
  if (typeof claims.iss !== 'string' || !SSO_ISSUERS.includes(claims.iss)) {
    throw new TokenVerificationError(
      'issuer',
      `Access token issuer ${String(claims.iss)} is not EVE SSO`,
    );
  }
  const audience = audienceList(claims.aud);
  if (!audience.includes(clientId) || !audience.includes(SSO_AUDIENCE)) {
    throw new TokenVerificationError(
      'audience',
      `Access token audience does not name client id ${clientId} and ${SSO_AUDIENCE}`,
    );
  }
  if (typeof claims.exp !== 'number') {
    throw new TokenVerificationError(
      'expired',
      'Access token has no exp claim',
    );
  }
  if (nowMs / 1000 >= claims.exp + clockToleranceSeconds) {
    throw new TokenVerificationError(
      'expired',
      `Access token expired at ${new Date(claims.exp * 1000).toISOString()}`,
    );
  }
}

/** The `aud` claim as a list; SSO emits an array, a string is one entry. */
function audienceList(aud: unknown): unknown[] {
  if (typeof aud === 'string') return [aud];
  return Array.isArray(aud) ? aud : [];
}
