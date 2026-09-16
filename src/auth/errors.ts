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
  public readonly errorDescription?: string;

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
  public readonly characterId?: number;

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
