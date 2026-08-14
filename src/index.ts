// Main client
export { EsiClient, EsiClientConfig, EsiDatasource } from './EsiClient';
export { getDefaultClient } from './EsiClient';

// Builder & factory
export {
  CustomEsiClient,
  EsiClientBuilder,
  EsiApiFactory,
} from './EsiClientBuilder';
export { ApiClientType } from './core/ClientRegistry';

// Core (for direct instantiation)
export { ApiClient, TokenProvider } from './core/ApiClient';
export { ApiClientBuilder } from './core/ApiClientBuilder';
export {
  configureApiClient,
  ConfigureApiClientResult,
} from './core/configureApiClient';

// Base client (for custom domain client implementations)
export { BaseEsiClient } from './clients/BaseEsiClient';

// Domain clients
export { AllianceClient } from './clients/AllianceClient';
export { AssetsClient } from './clients/AssetsClient';
export { CalendarClient } from './clients/CalendarClient';
export { CharacterClient } from './clients/CharacterClient';
export { ClonesClient } from './clients/ClonesClient';
export { ContactsClient } from './clients/ContactsClient';
export { ContractsClient } from './clients/ContractsClient';
export { CorporationsClient } from './clients/CorporationsClient';
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

// Cursor pagination & client utilities
export {
  CursorOptions,
  CursorResult,
  CreateClientOptions,
  InferEndpointResult,
  UnwrapArray,
  WithMetadata,
  WithSafeMode,
  fetchAllCursorPages,
} from './core/endpoints/createClient';
export { CursorTokens } from './core/pagination/CursorPaginationHandler';

// Error class & type guards
export {
  EsiError,
  TimeoutError,
  EsiValidationError,
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
  sanitizeUrl,
} from './core/util/error';
export type { ValidationDirection } from './core/util/error';

// Endpoint definition types
export { DeprecationInfo } from './core/endpoints/EndpointDefinition';

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

// Batch operations
export {
  batchFetch,
  batchPost,
  BatchOptions,
  BatchResult,
} from './core/BatchRequestHandler';

// Diagnostics
export {
  EsiDiagnostics,
  CacheStats,
  CircuitBreakerStats,
} from './core/EsiDiagnostics';

// Async pagination
export {
  fetchPages,
  PageResult,
} from './core/pagination/AsyncPaginationIterator';
export { buildEndpointPath } from './core/endpoints/buildEndpointPath';

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
export { ILogger } from './core/logger/ILogger';
export { setLogger } from './core/logger/loggerUtil';

// Types
export * from './types/api-responses';

// Schemas (Zod runtime validation)
export * as schemas from './schemas';
