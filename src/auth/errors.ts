/** Base class for every error raised by the auth subsystem. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * EVE SSO answered a token or revoke request with a non-2xx status.
 *
 * `errorCode` is the OAuth2 `error` field from the response body
 * (`invalid_client`, `invalid_request`, ...) or `unknown` when the body could
 * not be parsed. `statusCode` is the HTTP status.
 */
export class SsoError extends AuthError {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errorDescription?: string | undefined;

  constructor(
    statusCode: number,
    errorCode: string,
    errorDescription?: string,
  ) {
    const detail = errorDescription ? `: ${errorDescription}` : '';
    super(`EVE SSO request failed (${statusCode} ${errorCode})${detail}`);
    this.name = 'SsoError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
  }

  /** True for statuses where the same request can be retried later. */
  isRetryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500;
  }
}

/**
 * The refresh token is no longer accepted by SSO (`invalid_grant`), or the
 * manager has already recorded that outcome for the character. The character
 * must log in again; retrying cannot help.
 */
export class TokenRevokedError extends AuthError {
  public readonly characterId?: number | undefined;

  constructor(message: string, characterId?: number) {
    super(message);
    this.name = 'TokenRevokedError';
    this.characterId = characterId;
  }
}

/** A JWT access token could not be decoded into the claims the manager needs. */
export class TokenDecodeError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'TokenDecodeError';
  }
}

/** Why {@link TokenVerificationError} rejected a token. */
export type TokenVerificationFailure =
  /** Not a JWT, or the header or payload is not a JSON object. */
  | 'malformed'
  /** The header names an algorithm other than RS256 (including `none`). */
  | 'algorithm'
  /** No key in EVE SSO's key set carries the token's `kid`, even after a refetch. */
  | 'unknown-key'
  /** The signature does not match the header and payload. */
  | 'signature'
  /** The `iss` claim is not EVE SSO. */
  | 'issuer'
  /** The `aud` claim does not name the client id and `EVE Online`. */
  | 'audience'
  /** The `exp` claim is missing or in the past. */
  | 'expired'
  /** The key set could not be fetched or parsed. */
  | 'jwks-unavailable';

/**
 * An access token failed JWKS signature verification or claim validation.
 * `reason` says which check failed; the token's claims must not be trusted.
 */
export class TokenVerificationError extends AuthError {
  public readonly reason: TokenVerificationFailure;

  constructor(reason: TokenVerificationFailure, message: string) {
    super(message);
    this.name = 'TokenVerificationError';
    this.reason = reason;
  }
}

/** No token is stored for the requested character. */
export class CharacterNotFoundError extends AuthError {
  public readonly characterId: number;

  constructor(characterId: number) {
    super(`No token stored for character ${characterId}`);
    this.name = 'CharacterNotFoundError';
    this.characterId = characterId;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isSsoError(error: unknown): error is SsoError {
  return error instanceof SsoError;
}

export function isTokenRevoked(error: unknown): error is TokenRevokedError {
  return error instanceof TokenRevokedError;
}

export function isCharacterNotFound(
  error: unknown,
): error is CharacterNotFoundError {
  return error instanceof CharacterNotFoundError;
}

export function isTokenVerificationError(
  error: unknown,
): error is TokenVerificationError {
  return error instanceof TokenVerificationError;
}
