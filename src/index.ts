// Legacy construction tree, deprecated since 12.1.0 and removed in 13.0.0:
// EsiClient, getDefaultClient, CustomEsiClient, EsiClientBuilder,
// EsiApiFactory, ApiClientType, ApiClientBuilder, BaseEsiClient, the domain
// clients below and RouteOptions, plus the pipeline aliases from
// src/legacyExports.ts, the hand-written response types and the schemas
// namespace (see src/schemas/index.ts). Each declaration carries the
// @deprecated tag, so editors and TypeDoc flag these names here too. The
// replacement is createEsi() from '@lgriffin/esi.ts/client'; the manifest,
// with the parity gaps still open, is guides/LEGACY-REMOVAL.md.

// Main client
export { EsiClient, EsiDatasource } from './EsiClient';
export { getDefaultClient } from './EsiClient';

// Builder & factory
export {
  CustomEsiClient,
  EsiClientBuilder,
  EsiApiFactory,
} from './EsiClientBuilder';
export { ApiClientType } from './clients/ClientRegistry';

// Core (for direct instantiation)
export { TokenProvider, FetchLike } from './core/ApiClient';
export { ApiClientBuilder } from './core/ApiClientBuilder';

// Deprecated root names for pipeline pieces only the legacy tree needs; the
// aliases carry the @deprecated tags (src/legacyExports.ts).
export {
  ApiClient,
  EsiClientConfig,
  configureApiClient,
  ConfigureApiClientResult,
  buildEndpointPath,
  DeprecationInfo,
  CreateClientOptions,
  CursorOptions,
  CursorResult,
  CursorTokens,
  InferEndpointResult,
  UnwrapArray,
  WithMetadata,
  WithSafeMode,
  fetchAllCursorPages,
  fetchAllPages,
  fetchPages,
  PageResult,
  batchFetch,
  batchPost,
  BatchOptions,
  BatchResult,
  EsiDiagnostics,
  CacheStats,
  CircuitBreakerStats,
} from './legacyExports';

// Base client (for custom domain client implementations)
export { BaseEsiClient } from './clients/BaseEsiClient';

// Domain clients (deprecated since 12.1.0; see the note at the top)
export { AllianceClient } from './clients/AllianceClient';
export { AssetsClient } from './clients/AssetsClient';
export { CalendarClient } from './clients/CalendarClient';
export { CharacterClient } from './clients/CharacterClient';
export { ClonesClient } from './clients/ClonesClient';
export { ContactsClient } from './clients/ContactsClient';
export { ContractsClient } from './clients/ContractsClient';
export { CorporationsClient } from './clients/CorporationsClient';
export { CorporationProjectsClient } from './clients/CorporationProjectsClient';
export { DogmaClient } from './clients/DogmaClient';
export { FactionClient } from './clients/FactionClient';
export { FittingsClient } from './clients/FittingsClient';
export { FleetClient } from './clients/FleetClient';
export { IncursionsClient } from './clients/IncursionsClient';
export { IndustryClient } from './clients/IndustryClient';
export { InsuranceClient } from './clients/InsuranceClient';
export { KillmailsClient } from './clients/KillmailsClient';
export { LocationClient } from './clients/LocationClient';
export { LoyaltyClient } from './clients/LoyaltyClient';
export { MailClient } from './clients/MailClient';
export { MarketClient } from './clients/MarketClient';
export { PiClient } from './clients/PiClient';
export { RouteClient, RouteOptions } from './clients/RouteClient';
export { SearchClient } from './clients/SearchClient';
export { CharacterSkillsClient } from './clients/SkillsClient';
export { SovereigntyClient } from './clients/SovereigntyClient';
export { StatusClient } from './clients/StatusClient';
export { UiClient } from './clients/UiClient';
export { UniverseClient } from './clients/UniverseClient';
export { WalletClient } from './clients/WalletClient';
export { WarsClient } from './clients/WarsClient';
export { MetaClient } from './clients/MetaClient';
export { FreelanceJobsClient } from './clients/FreelanceJobsClient';
export { SkyhooksClient } from './clients/SkyhooksClient';
export { MercenaryClient } from './clients/MercenaryClient';
export { MilitaryCampaignsClient } from './clients/MilitaryCampaignsClient';
export { AccessListsClient } from './clients/AccessListsClient';
export { CosmeticsClient } from './clients/CosmeticsClient';
export { ParagonHubClient } from './clients/ParagonHubClient';

// Error class & type guards
export {
  EsiError,
  TimeoutError,
  EsiValidationError,
  EsiNetworkError,
  EsiFaultError,
  EsiConfigurationError,
  EsiParseError,
  EsiPaginationError,
  EsiTokenRefreshError,
  isEsiError,
  isRateLimited,
  isNotFound,
  isUnauthorized,
  isForbidden,
  isServerError,
  isTimeout,
  isRetryable,
  isValidationError,
  isCircuitOpen,
  isNetworkError,
  isFaultError,
  isConfigurationError,
  isParseError,
  isPaginationError,
  isTokenRefreshError,
  sanitizeUrl,
} from './core/util/error';
export type {
  ValidationDirection,
  EsiFaultCode,
  PaginationStopReason,
  EsiPaginationErrorDetails,
} from './core/util/error';
// What pagination does with a walk it cannot prove complete
// (`incompletePages` on EsiClientConfig and on createEsi's options).
export type { IncompletePagesMode } from './core/pagination/pageLimit';

// Middleware
export {
  RequestInterceptor,
  ResponseInterceptor,
  RequestContext,
  ResponseContext,
} from './core/middleware/Middleware';

// Circuit breaker
export {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitState,
  CircuitOpenError,
} from './core/circuitBreaker/CircuitBreaker';
export type { ICircuitBreaker } from './core/circuitBreaker/ICircuitBreaker';

// Rate limiter & cache (for direct instantiation)
export {
  RateLimiter,
  RateLimitEndpointOverride,
  RateLimitInfo,
  RateLimiterConfig,
} from './core/rateLimiter/RateLimiter';
export {
  ETagCacheManager,
  ETagCacheConfig,
} from './core/cache/ETagCacheManager';

// Retry
export { RetryConfig } from './core/util/retry';
export { RetryStrategy } from './core/RetryStrategy';
export type { RetryContext } from './core/RetryStrategy';
export type { IRetryStrategy } from './core/IRetryStrategy';

// Request deduplication
export { RequestDeduplicator } from './core/RequestDeduplicator';
export type { IDeduplicator } from './core/IDeduplicator';

// Interfaces (for custom implementations / testing)
export { ICache } from './core/cache/ICache';
export {
  IRateLimiter,
  RateLimitGroupStatus,
} from './core/rateLimiter/IRateLimiter';
export { RateLimitGroupSpec } from './core/endpoints/esi-rate-limit-groups.generated';
export {
  EsiScope,
  esiEndpointScopes,
} from './core/endpoints/esi-scopes.generated';
export { ILogger, LogContext, LoggerLevel } from './core/logger/ILogger';
export {
  setLogger,
  getLogger,
  logFatal,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logTrace,
} from './core/logger/loggerUtil';
export { createNoopLogger } from './core/logger/NoopLogger';
export { createConsoleLogger } from './core/logger/ConsoleLogger';
export { createDefaultLogger, toPinoLogger } from './core/logger/DefaultLogger';
export type { LogLevel } from './core/logger/DefaultLogger';

// Types
export * from './types/api-responses';

// Schemas (Zod runtime validation). Deprecated as an entry in 12.1.0 (see
// src/schemas/index.ts and guides/LEGACY-REMOVAL.md) without a tag on this
// namespace: an aliased namespace would drop every schema from the API
// report, and the report is how a tightened schema is caught as a break.
export * as schemas from './schemas';

// Auth: SSO client, token manager, storage adapters
export {
  EveSsoClient,
  DEFAULT_SSO_BASE_URL,
  EsiTokenManager,
  MemoryTokenStorage,
  FileTokenStorage,
  AuthError,
  SsoError,
  TokenRevokedError,
  TokenDecodeError,
  TokenVerificationError,
  CharacterNotFoundError,
  isAuthError,
  isSsoError,
  isTokenRevoked,
  isTokenVerificationError,
  isCharacterNotFound,
  decodeAccessToken,
  decodeJwtPayload,
  parseCharacterId,
  parseScopes,
  generatePkcePair,
  generateCodeVerifier,
  codeChallengeFromVerifier,
  generateState,
  SsoJwks,
  verifyAccessToken,
  DEFAULT_SSO_JWKS_URL,
} from './auth';
export type {
  ITokenStorage,
  StoredToken,
  EveSsoClientConfig,
  SsoTokenResponse,
  AuthorizationUrlOptions,
  ExchangeCodeOptions,
  RefreshOptions,
  EsiTokenManagerConfig,
  AddCharacterOptions,
  RemoveCharacterOptions,
  RefreshAllOptions,
  RefreshResult,
  RefreshStatus,
  CharacterSummary,
  ManagedClientConfig,
  FileTokenStorageOptions,
  FileTokenStorageLockOptions,
  DecodedAccessToken,
  EveJwtClaims,
  PkcePair,
  SsoJwksOptions,
  VerifyAccessTokenOptions,
  TokenVerificationFailure,
} from './auth';
