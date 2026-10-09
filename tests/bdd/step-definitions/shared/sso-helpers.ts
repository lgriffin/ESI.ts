import { generateKeyPairSync, KeyObject, sign } from 'crypto';
import fetchMock from 'jest-fetch-mock';
import type { StoredToken } from '../../../../src/auth/types';

export const SSO_BASE_URL = 'https://login.eveonline.com';
export const SSO_TOKEN_URL = `${SSO_BASE_URL}/v2/oauth/token`;
export const SSO_JWKS_URL = `${SSO_BASE_URL}/oauth/jwks`;

export const DEFAULT_CHARACTER_ID = 2114794365;
export const DEFAULT_CHARACTER_NAME = 'Aurora Vale';
export const DEFAULT_SCOPES = ['esi-wallet.read_character_wallet.v1'];

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export interface FakeJwtClaims {
  characterId?: number;
  characterName?: string;
  scopes?: string[];
  expiresInSeconds?: number;
  ownerHash?: string;
  /** Client id placed in the aud claim. Defaults to `test-client-id`. */
  clientId?: string;
}

/** Build an unsigned JWT with the claim layout EVE SSO uses. */
export function makeJwt(claims: FakeJwtClaims = {}): string {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'JWT-Signature-Key' };
  return [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(jwtPayload(claims))),
    base64url('signature'),
  ].join('.');
}

function jwtPayload(claims: FakeJwtClaims): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: `CHARACTER:EVE:${claims.characterId ?? DEFAULT_CHARACTER_ID}`,
    name: claims.characterName ?? DEFAULT_CHARACTER_NAME,
    scp: claims.scopes ?? DEFAULT_SCOPES,
    exp: now + (claims.expiresInSeconds ?? 1199),
    iat: now,
    iss: SSO_BASE_URL,
    aud: [claims.clientId ?? 'test-client-id', 'EVE Online'],
    owner: claims.ownerHash ?? 'owner-hash',
    tenant: 'tranquility',
    kid: 'JWT-Signature-Key',
    azp: claims.clientId ?? 'test-client-id',
    jti: 'jti-' + Math.random().toString(36).slice(2),
  };
}

/** An RS256 key pair standing in for one of SSO's signing keys. */
export interface SigningKey {
  kid: string;
  privateKey: KeyObject;
  publicKey: KeyObject;
}

const signingKeys = new Map<string, SigningKey>();

/**
 * The RS256 key pair for a key id, generated once per test run. SSO's
 * `JWT-Signature-Key` is the "current" key; any other id plays a rotated one.
 */
export function signingKey(kid = 'JWT-Signature-Key'): SigningKey {
  let key = signingKeys.get(kid);
  if (!key) {
    const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    key = { kid, privateKey: pair.privateKey, publicKey: pair.publicKey };
    signingKeys.set(kid, key);
  }
  return key;
}

/** A JWT with SSO's claim layout, RS256-signed by `key`. */
export function makeSignedJwt(
  claims: FakeJwtClaims = {},
  key: SigningKey = signingKey(),
): string {
  const header = { alg: 'RS256', typ: 'JWT', kid: key.kid };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(jwtPayload(claims)),
  )}`;
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(signingInput),
    key.privateKey,
  );
  return `${signingInput}.${base64url(signature)}`;
}

/** The JWT with its payload replaced by `payload`, keeping the original signature. */
export function withEditedPayload(
  jwt: string,
  edit: (payload: Record<string, unknown>) => Record<string, unknown>,
): string {
  const [header, payload, signature] = jwt.split('.');
  const claims = JSON.parse(
    Buffer.from(payload!, 'base64url').toString('utf8'),
  ) as Record<string, unknown>;
  return [header, base64url(JSON.stringify(edit(claims))), signature].join('.');
}

/** JSON body of SSO's JWKS endpoint holding the public halves of `keys`. */
export function jwksBody(keys: SigningKey[]): string {
  return JSON.stringify({
    keys: keys.map((key) => ({
      ...key.publicKey.export({ format: 'jwk' }),
      alg: 'RS256',
      kid: key.kid,
      use: 'sig',
    })),
    SkipUnresolvedJsonWebKeys: true,
  });
}

export function queueJwksResponse(keys: SigningKey[]): void {
  fetchMock.mockResponseOnce(jwksBody(keys), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jwksCallCount(): number {
  return fetchMock.mock.calls.filter(
    ([input]) => String(input) === SSO_JWKS_URL,
  ).length;
}

/** The same JWT with its signature segment replaced by bytes no key signed. */
export function withForeignSignature(jwt: string): string {
  const [header, payload] = jwt.split('.');
  return [header, payload, base64url('not-signed-by-eve-sso')].join('.');
}

export interface SsoTokenBodyOptions extends FakeJwtClaims {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** JSON body of a successful SSO token response. */
export function ssoTokenBody(options: SsoTokenBodyOptions = {}): string {
  return JSON.stringify({
    access_token: options.accessToken ?? makeJwt(options),
    refresh_token:
      options.refreshToken ?? 'refresh-' + Math.random().toString(36).slice(2),
    expires_in: options.expiresIn ?? 1199,
    token_type: 'Bearer',
  });
}

/** JSON body of an SSO error response. */
export function ssoErrorBody(errorCode: string, description?: string): string {
  return JSON.stringify({
    error: errorCode,
    error_description: description ?? `SSO returned ${errorCode}`,
  });
}

export function isSsoTokenRequest(url: string): boolean {
  return url.startsWith(SSO_TOKEN_URL);
}

export function ssoCallCount(): number {
  return fetchMock.mock.calls.filter(([input]) =>
    isSsoTokenRequest(String(input)),
  ).length;
}

export function queueSsoTokenResponse(options: SsoTokenBodyOptions = {}): void {
  fetchMock.mockResponseOnce(ssoTokenBody(options), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function queueSsoErrorResponse(status: number, errorCode: string): void {
  fetchMock.mockResponseOnce(ssoErrorBody(errorCode), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface StoredTokenOptions extends FakeJwtClaims {
  accessToken?: string;
  refreshToken?: string;
  revokedAt?: number;
}

/** A StoredToken whose access token is a JWT matching its metadata. */
export function makeStoredToken(options: StoredTokenOptions = {}): StoredToken {
  const characterId = options.characterId ?? DEFAULT_CHARACTER_ID;
  const expiresInSeconds = options.expiresInSeconds ?? 1199;
  const token: StoredToken = {
    characterId,
    characterName: options.characterName ?? `Character ${characterId}`,
    accessToken:
      options.accessToken ??
      makeJwt({ ...options, characterId, expiresInSeconds }),
    refreshToken: options.refreshToken ?? `refresh-${characterId}`,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    scopes: options.scopes ?? DEFAULT_SCOPES,
    ownerHash: options.ownerHash ?? 'owner-hash',
    updatedAt: Date.now(),
  };
  if (options.revokedAt !== undefined) {
    token.revokedAt = options.revokedAt;
  }
  return token;
}

export function readFormBody(init: RequestInit | undefined): URLSearchParams {
  const body = init?.body;
  if (body instanceof URLSearchParams) return body;
  return new URLSearchParams(String(body ?? ''));
}

export function readHeader(
  init: RequestInit | undefined,
  name: string,
): string | null {
  const headers = init?.headers;
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const found = headers.find(([k]) => k.toLowerCase() === name.toLowerCase());
    return found ? found[1] : null;
  }
  const record = headers as Record<string, string>;
  const key = Object.keys(record).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return key ? record[key]! : null;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
