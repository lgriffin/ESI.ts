import { ApiClient } from './core/ApiClient';
import { validateBaseUrl } from './core/util/validation';
import type { Identity } from './core/ports/Identity';
import {
  ApiClientType,
  ClientInstance,
  createClientInstance,
  AllianceClient,
  AssetsClient,
  CalendarClient,
  CharacterClient,
  ClonesClient,
  ContactsClient,
  ContractsClient,
  CorporationsClient,
  DogmaClient,
  FactionClient,
  FittingsClient,
  FleetClient,
  IncursionsClient,
  IndustryClient,
  InsuranceClient,
  KillmailsClient,
  LocationClient,
  LoyaltyClient,
  MailClient,
  MarketClient,
  PiClient,
  RouteClient,
  SearchClient,
  CharacterSkillsClient,
  SovereigntyClient,
  StatusClient,
  UiClient,
  UniverseClient,
  WalletClient,
  WarsClient,
  MetaClient,
  FreelanceJobsClient,
  SkyhooksClient,
  MercenaryClient,
  AccessListsClient,
  CorporationProjectsClient,
  CosmeticsClient,
  ParagonHubClient,
  MilitaryCampaignsClient,
} from './clients/ClientRegistry';
import { EsiClientConfig } from './EsiClient';
import { configureApiClient } from './core/configureApiClient';
import type { PublicDomainClients } from './clients/publicClients';
import { claimPipeline, diagnosticsFor } from './core/pipelineOwnership';
import {
  ETagCacheManager,
  type ETagCacheConfig,
} from './core/cache/ETagCacheManager';
import { RequestDeduplicator } from './core/RequestDeduplicator';
import {
  EsiDiagnostics,
  type CacheStats,
  type CircuitBreakerStats,
} from './core/EsiDiagnostics';
import { logInfo } from './core/logger/clientLog';
import {
  domainClientViews,
  type MetadataClients,
  type SafeModeClients,
} from './clients/domainViews';

export { ApiClientType, ClientInstance };
export type {
  PublicClient,
  PublicDomainClients,
} from './clients/publicClients';

/**
 * A {@link CustomEsiClient} that holds no token, typed so that a method
 * needing one does not compile: each domain accessor returns a
 * `PublicClient`, the domain client with its authenticated methods left out.
 * Built by {@link EsiClientBuilder.buildPublic}. A cast that reaches an
 * authenticated method anyway fails with NO_AUTH_TOKEN before any request.
 */
export type PublicCustomEsiClient = PublicDomainClients &
  Pick<
    CustomEsiClient,
    | 'getEnabledClients'
    | 'hasClient'
    | 'diagnostics'
    | 'getCacheStats'
    | 'clearCache'
    | 'updateCacheConfig'
    | 'getCircuitBreakerStats'
    | 'resetCircuitBreaker'
    | 'shutdown'
  >;

/**
 * The custom domain clients chosen with {@link EsiClientBuilder}, sharing one
 * `ApiClient`: one cache, rate limiter, circuit breaker and deduplicator.
 * See guides/CLIENT-ARCHITECTURE.md.
 */
export class CustomEsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, ClientInstance> = new Map();
  private enabledClients: Set<ApiClientType>;
  private deduplicator: RequestDeduplicator | null = null;
  private etagCacheEnabled: boolean;
  private suppliedCache: boolean;
  private suppliedCircuitBreaker: boolean;
  private _diagnostics: EsiDiagnostics | null = null;
  private metadataView: unknown;
  private safeModeView: unknown;
  private parent: CustomEsiClient | null = null;
  private identityViews: WeakMap<Identity, CustomEsiClient> | null = null;

  constructor(config: EsiClientConfig & { clients: ApiClientType[] }) {
    this.enabledClients = new Set(config.clients);
    const baseUrl = validateBaseUrl(
      config.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      config.unsafeAllowCustomHost,
    );
    this.apiClient = new ApiClient(
      config.clientId || process.env.ESI_CLIENT_ID || 'esi-custom-client',
      baseUrl,
      config.accessToken || process.env.ESI_ACCESS_TOKEN,
    );

    if (config.language) {
      this.apiClient.setLanguage(config.language);
    }

    if (config.compatibilityDate) {
      this.apiClient.setCompatibilityDate(config.compatibilityDate);
    }

    if (config.onTokenRefresh) {
      this.apiClient.setTokenProvider(config.onTokenRefresh);
    }

    const datasource = config.datasource;
    if (datasource) {
      this.apiClient.setDatasource(datasource);
    }

    const result = configureApiClient(this.apiClient, config);
    this.deduplicator = result.deduplicator;
    this.etagCacheEnabled = config.enableETagCache !== false;
    this.suppliedCache = config.cache !== undefined;
    this.suppliedCircuitBreaker = config.circuitBreaker !== undefined;

    for (const name of this.enabledClients) {
      this.clients.set(name, createClientInstance(name, this.apiClient));
    }

    logInfo(
      this.apiClient,
      `CustomEsiClient initialized with clients: ${config.clients.join(', ')}`,
      { clients: config.clients },
    );
  }

  getClient(clientType: ApiClientType): ClientInstance | undefined {
    return this.clients.get(clientType);
  }

  /**
   * The same enabled domain clients, sending as `identity`, over this
   * client's cache, rate limiter, circuit breaker, deduplicator, retry
   * policy, interceptors and settings. The same identity returns the same
   * view, and a view cannot change its identity. See `EsiClient.as` and
   * guides/MULTI-CHARACTER.md.
   */
  as(identity: Identity): CustomEsiClient {
    const root = this.parent ?? this;
    root.identityViews ??= new WeakMap();
    let view = root.identityViews.get(identity);
    if (!view) {
      view = CustomEsiClient.viewOf(root, identity);
      root.identityViews.set(identity, view);
    }
    return view;
  }

  /** A view of `root` that sends as `identity`; see {@link CustomEsiClient.as}. */
  private static viewOf(
    root: CustomEsiClient,
    identity: Identity,
  ): CustomEsiClient {
    const view = Object.create(CustomEsiClient.prototype) as CustomEsiClient;
    view.apiClient = root.apiClient.forIdentity(identity);
    view.enabledClients = root.enabledClients;
    view.clients = new Map();
    for (const name of root.enabledClients) {
      view.clients.set(name, createClientInstance(name, view.apiClient));
    }
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

  hasClient(clientType: ApiClientType): boolean {
    return this.clients.has(clientType);
  }

  getEnabledClients(): ApiClientType[] {
    return Array.from(this.enabledClients);
  }

  /**
   * The enabled domain clients as their `withMetadata()` views, from one
   * object; a domain the builder was not given is undefined. The same object
   * comes back on every call.
   */
  withMetadata(): MetadataClients<this> {
    this.metadataView ??= domainClientViews(
      (name) => this.clients.get(name),
      'metadata',
    );
    return this.metadataView as MetadataClients<this>;
  }

  /**
   * The enabled domain clients as their `withSafeMode()` views, from one
   * object; a domain the builder was not given is undefined. The same object
   * comes back on every call.
   */
  withSafeMode(): SafeModeClients<this> {
    this.safeModeView ??= domainClientViews(
      (name) => this.clients.get(name),
      'safe',
    );
    return this.safeModeView as SafeModeClients<this>;
  }

  /**
   * Reads and resets the cache, circuit breaker and deduplicator the enabled
   * clients share, as `EsiClient.diagnostics` does for its own.
   */
  get diagnostics(): EsiDiagnostics {
    // A view shares the root's middleware, so it reports through the root's.
    if (this.parent) return this.parent.diagnostics;
    this._diagnostics ??= diagnosticsFor(this.apiClient, this.etagCacheEnabled);
    return this._diagnostics;
  }

  /** The cache's entries, hits and misses; null when the ETag cache is off. */
  getCacheStats(): CacheStats | null {
    return this.diagnostics.getCacheStats();
  }

  /** Drops every cached entry. */
  clearCache(): void {
    this.diagnostics.clearCache();
  }

  /** Changes the built-in cache's limits in place; a supplied cache keeps its own. */
  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    this.diagnostics.updateCacheConfig(newConfig);
  }

  /** Each endpoint's circuit and failure count; null when the circuit breaker is off. */
  getCircuitBreakerStats(): CircuitBreakerStats | null {
    return this.diagnostics.getCircuitBreakerStats();
  }

  /** Closes one endpoint's circuit, or every circuit when `endpoint` is left out. */
  resetCircuitBreaker(endpoint?: string): void {
    this.diagnostics.resetCircuitBreaker(endpoint);
  }

  get alliance(): AllianceClient | undefined {
    return this.getClient('alliance') as AllianceClient;
  }
  get assets(): AssetsClient | undefined {
    return this.getClient('assets') as AssetsClient;
  }
  get calendar(): CalendarClient | undefined {
    return this.getClient('calendar') as CalendarClient;
  }
  get characters(): CharacterClient | undefined {
    return this.getClient('characters') as CharacterClient;
  }
  get clones(): ClonesClient | undefined {
    return this.getClient('clones') as ClonesClient;
  }
  get contacts(): ContactsClient | undefined {
    return this.getClient('contacts') as ContactsClient;
  }
  get contracts(): ContractsClient | undefined {
    return this.getClient('contracts') as ContractsClient;
  }
  get corporations(): CorporationsClient | undefined {
    return this.getClient('corporations') as CorporationsClient;
  }
  get dogma(): DogmaClient | undefined {
    return this.getClient('dogma') as DogmaClient;
  }
  get factions(): FactionClient | undefined {
    return this.getClient('factions') as FactionClient;
  }
  get fittings(): FittingsClient | undefined {
    return this.getClient('fittings') as FittingsClient;
  }
  get fleets(): FleetClient | undefined {
    return this.getClient('fleets') as FleetClient;
  }
  get incursions(): IncursionsClient | undefined {
    return this.getClient('incursions') as IncursionsClient;
  }
  get industry(): IndustryClient | undefined {
    return this.getClient('industry') as IndustryClient;
  }
  get insurance(): InsuranceClient | undefined {
    return this.getClient('insurance') as InsuranceClient;
  }
  get killmails(): KillmailsClient | undefined {
    return this.getClient('killmails') as KillmailsClient;
  }
  get location(): LocationClient | undefined {
    return this.getClient('location') as LocationClient;
  }
  get loyalty(): LoyaltyClient | undefined {
    return this.getClient('loyalty') as LoyaltyClient;
  }
  get mail(): MailClient | undefined {
    return this.getClient('mail') as MailClient;
  }
  get market(): MarketClient | undefined {
    return this.getClient('market') as MarketClient;
  }
  get pi(): PiClient | undefined {
    return this.getClient('pi') as PiClient;
  }
  get route(): RouteClient | undefined {
    return this.getClient('route') as RouteClient;
  }
  get search(): SearchClient | undefined {
    return this.getClient('search') as SearchClient;
  }
  get skills(): CharacterSkillsClient | undefined {
    return this.getClient('skills') as CharacterSkillsClient;
  }
  get sovereignty(): SovereigntyClient | undefined {
    return this.getClient('sovereignty') as SovereigntyClient;
  }
  get status(): StatusClient | undefined {
    return this.getClient('status') as StatusClient;
  }
  get ui(): UiClient | undefined {
    return this.getClient('ui') as UiClient;
  }
  get universe(): UniverseClient | undefined {
    return this.getClient('universe') as UniverseClient;
  }
  get wallet(): WalletClient | undefined {
    return this.getClient('wallet') as WalletClient;
  }
  get wars(): WarsClient | undefined {
    return this.getClient('wars') as WarsClient;
  }
  get meta(): MetaClient | undefined {
    return this.getClient('meta') as MetaClient;
  }
  get freelanceJobs(): FreelanceJobsClient | undefined {
    return this.getClient('freelanceJobs') as FreelanceJobsClient;
  }
  get skyhooks(): SkyhooksClient | undefined {
    return this.getClient('skyhooks') as SkyhooksClient;
  }
  get mercenary(): MercenaryClient | undefined {
    return this.getClient('mercenary') as MercenaryClient;
  }
  get accessLists(): AccessListsClient | undefined {
    return this.getClient('accessLists') as AccessListsClient;
  }
  get corporationProjects(): CorporationProjectsClient | undefined {
    return this.getClient('corporationProjects') as CorporationProjectsClient;
  }
  get cosmetics(): CosmeticsClient | undefined {
    return this.getClient('cosmetics') as CosmeticsClient;
  }
  get paragonHub(): ParagonHubClient | undefined {
    return this.getClient('paragonHub') as ParagonHubClient;
  }
  get militaryCampaigns(): MilitaryCampaignsClient | undefined {
    return this.getClient('militaryCampaigns') as MilitaryCampaignsClient;
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
    logInfo(this.apiClient, 'CustomEsiClient shutdown completed');
  }
}

/**
 * One custom domain client on its own `ApiClient`.
 *
 * {@link EsiApiFactory.createClient} is the way to build one by name. The nine
 * named `create*Client` methods have been deprecated since 11.0.0 in favour of
 * it; removing them needs a future major release, and none is scheduled.
 * For several domains on one shared pipeline, use {@link EsiClientBuilder}.
 *
 * @example
 * ```ts
 * import { EsiApiFactory, MarketClient } from '@lgriffin/esi.ts';
 *
 * const market = EsiApiFactory.createClient('market', {
 *   userAgent: 'price-checker/1.0 (ops@example.com)',
 * }) as MarketClient;
 * const prices = await market.getMarketPrices();
 * ```
 */
export class EsiApiFactory {
  /**
   * A standalone `AllianceClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('alliance', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.public.alliance(allianceId).get()`.
   */
  static createAllianceClient(config?: EsiClientConfig): AllianceClient {
    return createClientInstance(
      'alliance',
      this.buildApiClient(config),
    ) as AllianceClient;
  }

  /**
   * A standalone `CharacterClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('characters', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.public.character(characterId).get()`.
   */
  static createCharacterClient(config?: EsiClientConfig): CharacterClient {
    return createClientInstance(
      'characters',
      this.buildApiClient(config),
    ) as CharacterClient;
  }

  /**
   * A standalone `CorporationsClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('corporations', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.public.corporation(corporationId).get()`.
   */
  static createCorporationClient(config?: EsiClientConfig): CorporationsClient {
    return createClientInstance(
      'corporations',
      this.buildApiClient(config),
    ) as CorporationsClient;
  }

  /**
   * A standalone `MarketClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('market', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.public.market(regionId).orders.get({ order_type: 'sell' })`.
   */
  static createMarketClient(config?: EsiClientConfig): MarketClient {
    return createClientInstance(
      'market',
      this.buildApiClient(config),
    ) as MarketClient;
  }

  /**
   * A standalone `UniverseClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('universe', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.public.universe.types(typeId).get()`.
   */
  static createUniverseClient(config?: EsiClientConfig): UniverseClient {
    return createClientInstance(
      'universe',
      this.buildApiClient(config),
    ) as UniverseClient;
  }

  /**
   * A standalone `FleetClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('fleets', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.as(identity).fleet(fleetId).get()`.
   */
  static createFleetClient(config?: EsiClientConfig): FleetClient {
    return createClientInstance(
      'fleets',
      this.buildApiClient(config),
    ) as FleetClient;
  }

  /**
   * A standalone `AssetsClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('assets', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.as(identity).character(characterId).assets.get()`.
   */
  static createAssetsClient(config?: EsiClientConfig): AssetsClient {
    return createClientInstance(
      'assets',
      this.buildApiClient(config),
    ) as AssetsClient;
  }

  /**
   * A standalone `WalletClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('wallet', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.as(identity).character(characterId).wallet.get()`.
   */
  static createWalletClient(config?: EsiClientConfig): WalletClient {
    return createClientInstance(
      'wallet',
      this.buildApiClient(config),
    ) as WalletClient;
  }

  /**
   * A standalone `MailClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0. Use `EsiApiFactory.createClient('mail', config)`,
   * or {@link EsiClientBuilder} for several domains on one pipeline.
   * Removing this method needs a future major release; none is scheduled.
   * The spec-shaped alternative on `createEsi()` from `@lgriffin/esi.ts/client`:
   * `esi.as(identity).character(characterId).mail.get()`.
   */
  static createMailClient(config?: EsiClientConfig): MailClient {
    return createClientInstance(
      'mail',
      this.buildApiClient(config),
    ) as MailClient;
  }

  /**
   * Any of the registered domain clients, by name, on its own `ApiClient`.
   * The supported way to build a single custom client.
   */
  static createClient(
    clientType: ApiClientType,
    config?: EsiClientConfig,
  ): ClientInstance {
    return createClientInstance(clientType, this.buildApiClient(config));
  }

  private static buildApiClient(config?: EsiClientConfig): ApiClient {
    const baseUrl = validateBaseUrl(
      config?.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      config?.unsafeAllowCustomHost,
    );
    const client = new ApiClient(
      config?.clientId || process.env.ESI_CLIENT_ID || 'esi-standalone-client',
      baseUrl,
      config?.accessToken || process.env.ESI_ACCESS_TOKEN,
    );

    if (config?.language) {
      client.setLanguage(config.language);
    }

    if (config?.compatibilityDate) {
      client.setCompatibilityDate(config.compatibilityDate);
    }

    if (config?.onTokenRefresh) {
      client.setTokenProvider(config.onTokenRefresh);
    }

    const datasource = config?.datasource;
    if (datasource) {
      client.setDatasource(datasource);
    }

    configureApiClient(client, config);
    claimPipeline(client, {
      suppliedCache: config?.cache !== undefined,
      suppliedCircuitBreaker: config?.circuitBreaker !== undefined,
      suppliedDeduplicator: config?.deduplicator !== undefined,
    });
    return client;
  }
}

/**
 * Builds a {@link CustomEsiClient} holding only the domain clients added to it.
 * See guides/CLIENT-ARCHITECTURE.md.
 */
export class EsiClientBuilder {
  private clients: ApiClientType[] = [];
  private config: EsiClientConfig = {};

  addClient(clientType: ApiClientType): this {
    if (!this.clients.includes(clientType)) {
      this.clients.push(clientType);
    }
    return this;
  }

  addClients(clientTypes: ApiClientType[]): this {
    clientTypes.forEach((type) => this.addClient(type));
    return this;
  }

  withConfig(config: EsiClientConfig): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  withClientId(clientId: string): this {
    this.config.clientId = clientId;
    return this;
  }

  withAccessToken(accessToken: string): this {
    this.config.accessToken = accessToken;
    return this;
  }

  build(): CustomEsiClient {
    if (this.clients.length === 0) {
      throw new Error('At least one client type must be specified');
    }
    return new CustomEsiClient({ ...this.config, clients: this.clients });
  }

  /**
   * Builds the chosen domains as a public-only client: it holds no token,
   * whatever `withAccessToken`, `onTokenRefresh` or `ESI_ACCESS_TOKEN` say,
   * and its type leaves out every method that needs one, so calling one does
   * not compile. The counterpart of `createEsi()`'s `esi.public`.
   *
   * @example
   * ```ts
   * const pub = new EsiClientBuilder()
   *   .addClients(['market', 'universe'])
   *   .withClientId('price-checker/1.0 (ops@example.com)')
   *   .buildPublic();
   * const prices = await pub.market?.getMarketPrices();
   * ```
   */
  buildPublic(): PublicCustomEsiClient {
    if (this.clients.length === 0) {
      throw new Error('At least one client type must be specified');
    }
    const custom = new CustomEsiClient({
      ...this.config,
      accessToken: undefined,
      onTokenRefresh: undefined,
      clients: this.clients,
    });
    // The constructor falls back to ESI_ACCESS_TOKEN; an empty token sends no
    // Authorization header, so an authenticated call fails with NO_AUTH_TOKEN.
    custom['apiClient'].setAccessToken('');
    // A request interceptor cannot put one back either.
    custom['apiClient'].getMiddleware().withholdRequestHeaders('Authorization');
    return custom;
  }
}
