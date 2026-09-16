export type { ITokenStorage, StoredToken } from './types';

export { EveSsoClient, DEFAULT_SSO_BASE_URL } from './EveSsoClient';
export type {
  EveSsoClientConfig,
  SsoTokenResponse,
  AuthorizationUrlOptions,
  ExchangeCodeOptions,
  RefreshOptions,
} from './EveSsoClient';

export { EsiTokenManager } from './EsiTokenManager';
export type {
  EsiTokenManagerConfig,
  AddCharacterOptions,
  RemoveCharacterOptions,
  RefreshAllOptions,
  RefreshResult,
  RefreshStatus,
  CharacterSummary,
  ManagedClientConfig,
} from './EsiTokenManager';

export { MemoryTokenStorage } from './storage/MemoryTokenStorage';
export { FileTokenStorage } from './storage/FileTokenStorage';
export type { FileTokenStorageOptions } from './storage/FileTokenStorage';

export {
  AuthError,
  SsoError,
  TokenRevokedError,
  TokenDecodeError,
  CharacterNotFoundError,
  isAuthError,
  isSsoError,
  isTokenRevoked,
  isCharacterNotFound,
} from './errors';

export {
  decodeAccessToken,
  decodeJwtPayload,
  parseCharacterId,
  parseScopes,
} from './jwt';
export type { DecodedAccessToken, EveJwtClaims } from './jwt';

export {
  generatePkcePair,
  generateCodeVerifier,
  codeChallengeFromVerifier,
  generateState,
} from './pkce';
export type { PkcePair } from './pkce';
