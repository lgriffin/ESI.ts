import { ApiClient, TokenProvider } from './core/ApiClient';
import {
  RequestInterceptor,
  ResponseInterceptor,
} from './core/middleware/Middleware';
import {
  createClientInstance,
  ApiClientType,
  type ClientInstance,
} from './clients/ClientRegistry';
import type { EsiClientConfig, EsiDatasource } from './core/EsiClientConfig';
import { AllianceClient } from './clients/AllianceClient';
import { AssetsClient } from './clients/AssetsClient';
import { CalendarClient } from './clients/CalendarClient';
import { CharacterClient } from './clients/CharacterClient';
import { ClonesClient } from './clients/ClonesClient';
import { ContactsClient } from './clients/ContactsClient';
import { ContractsClient } from './clients/ContractsClient';
import { CorporationsClient } from './clients/CorporationsClient';
import { CorporationProjectsClient } from './clients/CorporationProjectsClient';
import { DogmaClient } from './clients/DogmaClient';
import { FactionClient } from './clients/FactionClient';
import { FittingsClient } from './clients/FittingsClient';
import { FleetClient } from './clients/FleetClient';
import { IncursionsClient } from './clients/IncursionsClient';
import { IndustryClient } from './clients/IndustryClient';
import { InsuranceClient } from './clients/InsuranceClient';
import { KillmailsClient } from './clients/KillmailsClient';
import { LocationClient } from './clients/LocationClient';
import { LoyaltyClient } from './clients/LoyaltyClient';
import { MailClient } from './clients/MailClient';
import { MarketClient } from './clients/MarketClient';
import { PiClient } from './clients/PiClient';
import { RouteClient } from './clients/RouteClient';
import { SearchClient } from './clients/SearchClient';
import { CharacterSkillsClient } from './clients/SkillsClient';
import { SovereigntyClient } from './clients/SovereigntyClient';
import { StatusClient } from './clients/StatusClient';
import { UiClient } from './clients/UiClient';
import { UniverseClient } from './clients/UniverseClient';
import { WalletClient } from './clients/WalletClient';
import { WarsClient } from './clients/WarsClient';
import { MetaClient } from './clients/MetaClient';
import { FreelanceJobsClient } from './clients/FreelanceJobsClient';
import { CosmeticsClient } from './clients/CosmeticsClient';
import { ParagonHubClient } from './clients/ParagonHubClient';
import { SkyhooksClient } from './clients/SkyhooksClient';
import { MercenaryClient } from './clients/MercenaryClient';
import { AccessListsClient } from './clients/AccessListsClient';
import { MilitaryCampaignsClient } from './clients/MilitaryCampaignsClient';
import { validateBaseUrl } from './core/util/validation';
import type { Identity } from './core/ports/Identity';
import { EsiConfigurationError } from './core/util/error';
import {
  ETagCacheManager,
  ETagCacheConfig,
} from './core/cache/ETagCacheManager';
import { CircuitBreakerConfig } from './core/circuitBreaker/CircuitBreaker';
import { RateLimiterConfig } from './core/rateLimiter/RateLimiter';
import { RequestDeduplicator } from './core/RequestDeduplicator';
import { RetryConfig } from './core/util/retry';
import { IRetryStrategy } from './core/IRetryStrategy';
import {
  EsiDiagnostics,
  type CacheStats,
  type CircuitBreakerStats,
} from './core/EsiDiagnostics';
import {
  batchFetchFor,
  batchPostFor,
  BatchOptions,
  BatchResult,
} from './core/BatchRequestHandler';
import { configureApiClient } from './core/configureApiClient';
import { logInfo } from './core/logger/clientLog';
import {
  domainClientViews,
  type MetadataClients,
  type SafeModeClients,
} from './clients/domainViews';

export type { EsiClientConfig, EsiDatasource } from './core/EsiClientConfig';

/**
 * Every custom domain client, created lazily, on one shared `ApiClient`.
 * See guides/CLIENT-ARCHITECTURE.md.
 */
export class EsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, unknown> = new Map();
  private etagCacheEnabled: boolean;
  private _diagnostics: EsiDiagnostics | null = null;
  private deduplicator: RequestDeduplicator | null = null;
  private suppliedCache: boolean;
  private suppliedCircuitBreaker: boolean;
  private metadataView: unknown;
  private safeModeView: unknown;
  private parent: EsiClient | null = null;
  private identityViews: WeakMap<Identity, EsiClient> | null = null;

  constructor(config?: EsiClientConfig) {
    const token = config?.accessToken || process.env.ESI_ACCESS_TOKEN;
    const baseUrl = validateBaseUrl(
      config?.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      config?.unsafeAllowCustomHost,
    );
    this.apiClient = new ApiClient(
      config?.clientId || process.env.ESI_CLIENT_ID || 'esi-client',
      baseUrl,
      token,
    );

    const datasource =
      config?.datasource ||
      (process.env.ESI_DATASOURCE as EsiDatasource | undefined);
    if (datasource) {
      this.apiClient.setDatasource(datasource);
    }

    if (config?.language) {
      this.apiClient.setLanguage(config.language);
    }

    if (config?.compatibilityDate) {
      this.apiClient.setCompatibilityDate(config.compatibilityDate);
    }

    if (config?.onTokenRefresh) {
      this.apiClient.setTokenProvider(config.onTokenRefresh);
    }

    const result = configureApiClient(this.apiClient, config);
    this.deduplicator = result.deduplicator;
    this.etagCacheEnabled = config?.enableETagCache !== false;
    this.suppliedCache = config?.cache !== undefined;
    this.suppliedCircuitBreaker = config?.circuitBreaker !== undefined;

    logInfo(this.apiClient, 'EsiClient initialized successfully', {
      baseUrl,
      clientId: config?.clientId,
    });
  }

  private getClient<T>(name: ApiClientType): T {
    if (!this.clients.has(name)) {
      this.clients.set(name, createClientInstance(name, this.apiClient));
    }
    return this.clients.get(name) as T;
  }

  // Domain client accessors
  get alliance(): AllianceClient {
    return this.getClient('alliance');
  }
  get assets(): AssetsClient {
    return this.getClient('assets');
  }
  get calendar(): CalendarClient {
    return this.getClient('calendar');
  }
  get characters(): CharacterClient {
    return this.getClient('characters');
  }
  get clones(): ClonesClient {
    return this.getClient('clones');
  }
  get contacts(): ContactsClient {
    return this.getClient('contacts');
  }
  get contracts(): ContractsClient {
    return this.getClient('contracts');
  }
  get corporations(): CorporationsClient {
    return this.getClient('corporations');
  }
  get corporationProjects(): CorporationProjectsClient {
    return this.getClient('corporationProjects');
  }
  get dogma(): DogmaClient {
    return this.getClient('dogma');
  }
  get factions(): FactionClient {
    return this.getClient('factions');
  }
  get fittings(): FittingsClient {
    return this.getClient('fittings');
  }
  get fleets(): FleetClient {
    return this.getClient('fleets');
  }
  get incursions(): IncursionsClient {
    return this.getClient('incursions');
  }
  get industry(): IndustryClient {
    return this.getClient('industry');
  }
  get insurance(): InsuranceClient {
    return this.getClient('insurance');
  }
  get killmails(): KillmailsClient {
    return this.getClient('killmails');
  }
  get location(): LocationClient {
    return this.getClient('location');
  }
  get loyalty(): LoyaltyClient {
    return this.getClient('loyalty');
  }
  get mail(): MailClient {
    return this.getClient('mail');
  }
  get market(): MarketClient {
    return this.getClient('market');
  }
  get pi(): PiClient {
    return this.getClient('pi');
  }
  get route(): RouteClient {
    return this.getClient('route');
  }
  get search(): SearchClient {
    return this.getClient('search');
  }
  get skills(): CharacterSkillsClient {
    return this.getClient('skills');
  }
  get sovereignty(): SovereigntyClient {
    return this.getClient('sovereignty');
  }
  get status(): StatusClient {
    return this.getClient('status');
  }
  get ui(): UiClient {
    return this.getClient('ui');
  }
  get universe(): UniverseClient {
    return this.getClient('universe');
  }
  get wallet(): WalletClient {
    return this.getClient('wallet');
  }
  get wars(): WarsClient {
    return this.getClient('wars');
  }
  get meta(): MetaClient {
    return this.getClient('meta');
  }
  get freelanceJobs(): FreelanceJobsClient {
    return this.getClient('freelanceJobs');
  }
  get cosmetics(): CosmeticsClient {
    return this.getClient('cosmetics');
  }
  get paragonHub(): ParagonHubClient {
    return this.getClient('paragonHub');
  }
  get skyhooks(): SkyhooksClient {
    return this.getClient('skyhooks');
  }
  get mercenary(): MercenaryClient {
    return this.getClient('mercenary');
  }
  get militaryCampaigns(): MilitaryCampaignsClient {
    return this.getClient('militaryCampaigns');
  }
  get accessLists(): AccessListsClient {
    return this.getClient('accessLists');
  }

  addRequestInterceptor(fn: RequestInterceptor): () => void {
    return this.apiClient.addRequestInterceptor(fn);
  }

  addResponseInterceptor(fn: ResponseInterceptor): () => void {
    return this.apiClient.addResponseInterceptor(fn);
  }

  /**
   * The same domain clients, sending as `identity`. The view shares this
   * client's cache, rate limiter, circuit breaker, deduplicator, retry
   * policy, interceptors and settings, so several characters draw on one
   * error budget and one cache, whose authenticated entries stay apart by the
   * character each token names. Before each authenticated request the view
   * asks `identity.accessToken()`, and after a 401 `refreshAccessToken()`.
   *
   * The same identity returns the same view, and `as` on a view answers from
   * the client it came from. A view cannot change its identity:
   * `setAccessToken` and `setTokenProvider` throw on it. See
   * guides/MULTI-CHARACTER.md.
   *
   * @example
   * ```ts
   * const esi = new EsiClient({ clientId: 'fleet-tool/2.1 (ops@example.com)' });
   * const pilot = esi.as(tokens.identity(characterId));
   * const wallet = await pilot.wallet.getCharacterWallet(characterId);
   * ```
   */
  as(identity: Identity): EsiClient {
    const root = this.parent ?? this;
    root.identityViews ??= new WeakMap();
    let view = root.identityViews.get(identity);
    if (!view) {
      view = EsiClient.viewOf(root, identity);
      root.identityViews.set(identity, view);
    }
    return view;
  }

  /** A view of `root` that sends as `identity`; see {@link EsiClient.as}. */
  private static viewOf(root: EsiClient, identity: Identity): EsiClient {
    const view = Object.create(EsiClient.prototype) as EsiClient;
    view.apiClient = root.apiClient.forIdentity(identity);
    view.clients = new Map();
    view.etagCacheEnabled = root.etagCacheEnabled;
    view._diagnostics = null;
    view.deduplicator = null;
    // The shared middleware belongs to the root: a view's shutdown leaves it.
    view.suppliedCache = true;
    view.suppliedCircuitBreaker = true;
    view.parent = root;
    view.identityViews = null;
    return view;
  }

  setAccessToken(token: string): void {
    if (this.parent) refuseOnIdentityView('setAccessToken');
    this.apiClient.setAccessToken(token);
    logInfo(this.apiClient, 'Access token updated');
  }

  setTokenProvider(provider: TokenProvider | undefined): void {
    if (this.parent) refuseOnIdentityView('setTokenProvider');
    this.apiClient.setTokenProvider(provider);
    logInfo(
      this.apiClient,
      provider ? 'Token provider configured' : 'Token provider removed',
    );
  }

  /**
   * Every domain client as its `withMetadata()` view, from one object:
   * `client.withMetadata().market.getMarketPrices()` resolves `{ data, meta }`.
   * The same object comes back on every call. See guides/USAGE.md.
   */
  withMetadata(): MetadataClients<this> {
    this.metadataView ??= domainClientViews(
      (name) => this.getClient<ClientInstance>(name),
      'metadata',
    );
    return this.metadataView as MetadataClients<this>;
  }

  /**
   * Every domain client as its `withSafeMode()` view, from one object: each
   * method that answers once resolves `{ ok, ... }` instead of rejecting.
   * The same object comes back on every call. See guides/ERRORS.md.
   */
  withSafeMode(): SafeModeClients<this> {
    this.safeModeView ??= domainClientViews(
      (name) => this.getClient<ClientInstance>(name),
      'safe',
    );
    return this.safeModeView as SafeModeClients<this>;
  }

  get diagnostics(): EsiDiagnostics {
    // A view shares the root's middleware, so it reports through the root's.
    if (this.parent) return this.parent.diagnostics;
    if (!this._diagnostics) {
      this._diagnostics = new EsiDiagnostics(
        this.apiClient,
        this.etagCacheEnabled,
        this.apiClient.getDeduplicator(),
      );
    }
    return this._diagnostics;
  }

  getCacheStats(): CacheStats | null {
    return this.diagnostics.getCacheStats();
  }

  clearCache(): void {
    this.diagnostics.clearCache();
  }

  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    this.diagnostics.updateCacheConfig(newConfig);
  }

  getCircuitBreakerStats(): CircuitBreakerStats | null {
    return this.diagnostics.getCircuitBreakerStats();
  }

  resetCircuitBreaker(endpoint?: string): void {
    this.diagnostics.resetCircuitBreaker(endpoint);
  }

  async batch<K, T>(
    keys: K[],
    fetcher: (key: K) => Promise<T>,
    options?: BatchOptions,
  ): Promise<BatchResult<K, T>> {
    return batchFetchFor(this.apiClient, keys, fetcher, options);
  }

  async batchPost<T>(
    ids: number[],
    poster: (chunk: number[]) => Promise<T[]>,
    chunkSize?: number,
  ): Promise<T[]> {
    return batchPostFor(this.apiClient, ids, poster, chunkSize);
  }

  /**
   * Stops the cleanup timers of the cache and circuit breaker the client
   * built and drops its in-flight table; a cache store, circuit breaker or
   * deduplicator supplied in the config is left to its owner.
   */
  shutdown(): void {
    const cache = this.apiClient.getCache();
    if (cache && !this.suppliedCache) {
      (cache as ETagCacheManager).shutdown();
    }
    const cb = this.apiClient.getCircuitBreaker();
    if (cb && !this.suppliedCircuitBreaker) {
      cb.shutdown();
    }
    if (this.deduplicator) {
      this.deduplicator.clear();
    }
    this.clients.clear();
    logInfo(this.apiClient, 'EsiClient shutdown completed');
  }
}

/** A view's identity is fixed when it is made. */
function refuseOnIdentityView(method: string): never {
  throw new EsiConfigurationError(
    'CONFIGURATION_ERROR',
    `${method} cannot change the identity of a view made by as(identity). Fix: call as() with another identity, or set the token on the client the view came from`,
  );
}

let _defaultClient: EsiClient | null = null;

/**
 * A process-wide `EsiClient`, built on first call from the `ESI_*` environment variables.
 */
export function getDefaultClient(): EsiClient {
  if (!_defaultClient) {
    _defaultClient = new EsiClient();
  }
  return _defaultClient;
}
