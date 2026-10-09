import * as auth from '../../../src/auth';
import * as root from '../../../src';
import * as errors from '../../../src/errors';

describe('auth module exports', () => {
  const runtimeExports = [
    'EveSsoClient',
    'DEFAULT_SSO_BASE_URL',
    'EsiTokenManager',
    'MemoryTokenStorage',
    'FileTokenStorage',
    'AuthError',
    'SsoError',
    'TokenRevokedError',
    'TokenDecodeError',
    'TokenVerificationError',
    'CharacterNotFoundError',
    'isAuthError',
    'isSsoError',
    'isTokenRevoked',
    'isTokenVerificationError',
    'isCharacterNotFound',
    'decodeAccessToken',
    'decodeJwtPayload',
    'parseCharacterId',
    'parseScopes',
    'generatePkcePair',
    'generateCodeVerifier',
    'codeChallengeFromVerifier',
    'generateState',
    'SsoJwks',
    'verifyAccessToken',
    'DEFAULT_SSO_JWKS_URL',
  ] as const;

  it.each(runtimeExports)(
    'exports %s from src/auth and the package root',
    (name) => {
      expect(auth[name]).toBeDefined();
      expect((root as Record<string, unknown>)[name]).toBe(auth[name]);
    },
  );

  it('re-exports the auth error classes from the errors entry point', () => {
    expect(errors.SsoError).toBe(auth.SsoError);
    expect(errors.TokenRevokedError).toBe(auth.TokenRevokedError);
    expect(errors.CharacterNotFoundError).toBe(auth.CharacterNotFoundError);
    expect(errors.isTokenRevoked).toBe(auth.isTokenRevoked);
    expect(errors.TokenVerificationError).toBe(auth.TokenVerificationError);
    expect(errors.isTokenVerificationError).toBe(auth.isTokenVerificationError);
  });
});
