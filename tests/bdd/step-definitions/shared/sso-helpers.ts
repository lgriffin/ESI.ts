import fetchMock from 'jest-fetch-mock';
import type { StoredToken } from '../../../../src/auth/types';

export const SSO_BASE_URL = 'https://login.eveonline.com';
export const SSO_TOKEN_URL = `${SSO_BASE_URL}/v2/oauth/token`;

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
}

/** Build an unsigned JWT with the claim layout EVE SSO uses. */
export function makeJwt(claims: FakeJwtClaims = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: `CHARACTER:EVE:${claims.characterId ?? DEFAULT_CHARACTER_ID}`,
    name: claims.characterName ?? DEFAULT_CHARACTER_NAME,
    scp: claims.scopes ?? DEFAULT_SCOPES,
    exp: now + (claims.expiresInSeconds ?? 1199),
    iat: now,
    iss: SSO_BASE_URL,
    aud: ['test-client-id', 'EVE Online'],
    owner: claims.ownerHash ?? 'owner-hash',
    tenant: 'tranquility',
    kid: 'JWT-Signature-Key',
    azp: 'test-client-id',
    jti: 'jti-' + Math.random().toString(36).slice(2),
  };
  const header = { alg: 'RS256', typ: 'JWT', kid: 'JWT-Signature-Key' };
  return [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(payload)),
    base64url('signature'),
  ].join('.');
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
