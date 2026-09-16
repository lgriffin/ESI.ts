import {
  AuthError,
  CharacterNotFoundError,
  SsoError,
  TokenDecodeError,
  TokenRevokedError,
  isAuthError,
  isCharacterNotFound,
  isSsoError,
  isTokenRevoked,
} from '../../../src/auth/errors';

describe('auth errors', () => {
  it('SsoError carries status, code and description', () => {
    const err = new SsoError(400, 'invalid_client', 'bad secret');
    expect(err).toBeInstanceOf(AuthError);
    expect(err.name).toBe('SsoError');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('invalid_client');
    expect(err.errorDescription).toBe('bad secret');
    expect(err.message).toBe(
      'EVE SSO request failed (400 invalid_client): bad secret',
    );
  });

  it('SsoError omits the description suffix when absent', () => {
    expect(new SsoError(503, 'unknown').message).toBe(
      'EVE SSO request failed (503 unknown)',
    );
  });

  it('SsoError is retryable for 429 and 5xx only', () => {
    expect(new SsoError(429, 'rate_limited').isRetryable()).toBe(true);
    expect(new SsoError(500, 'server_error').isRetryable()).toBe(true);
    expect(new SsoError(503, 'server_error').isRetryable()).toBe(true);
    expect(new SsoError(400, 'invalid_request').isRetryable()).toBe(false);
    expect(new SsoError(401, 'invalid_client').isRetryable()).toBe(false);
  });

  it('TokenRevokedError records the character when known', () => {
    const anonymous = new TokenRevokedError('revoked');
    expect(anonymous.characterId).toBeUndefined();
    expect(anonymous.name).toBe('TokenRevokedError');
    const bound = new TokenRevokedError('revoked', 42);
    expect(bound.characterId).toBe(42);
    expect(bound).toBeInstanceOf(AuthError);
  });

  it('CharacterNotFoundError names the character', () => {
    const err = new CharacterNotFoundError(7);
    expect(err.characterId).toBe(7);
    expect(err.message).toBe('No token stored for character 7');
    expect(err.name).toBe('CharacterNotFoundError');
  });

  it('TokenDecodeError is an AuthError', () => {
    const err = new TokenDecodeError('bad');
    expect(err.name).toBe('TokenDecodeError');
    expect(err).toBeInstanceOf(AuthError);
  });

  it('type guards narrow by class', () => {
    const sso = new SsoError(500, 'x');
    const revoked = new TokenRevokedError('x');
    const missing = new CharacterNotFoundError(1);
    const plain = new Error('x');

    expect(isAuthError(sso)).toBe(true);
    expect(isAuthError(plain)).toBe(false);
    expect(isSsoError(sso)).toBe(true);
    expect(isSsoError(revoked)).toBe(false);
    expect(isTokenRevoked(revoked)).toBe(true);
    expect(isTokenRevoked(sso)).toBe(false);
    expect(isCharacterNotFound(missing)).toBe(true);
    expect(isCharacterNotFound(null)).toBe(false);
  });
});
