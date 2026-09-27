import { ApiClient } from './core/ApiClient';
import { validateBaseUrl } from './core/util/validation';
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
import { ETagCacheManager } from './core/cache/ETagCacheManager';
import { RequestDeduplicator } from './core/RequestDeduplicator';
import { logInfo } from './core/logger/clientLog';

export { ApiClientType, ClientInstance };

export class CustomEsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, ClientInstance> = new Map();
  private enabledClients: Set<ApiClientType>;
  private deduplicator: RequestDeduplicator | null = null;

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

  hasClient(clientType: ApiClientType): boolean {
    return this.clients.has(clientType);
  }

  getEnabledClients(): ApiClientType[] {
    return Array.from(this.enabledClients);
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

  shutdown(): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).shutdown();
    }
    const cb = this.apiClient.getCircuitBreaker();
    if (cb) {
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
 * One legacy domain client on its own `ApiClient`.
 *
 * The nine named `create*Client` methods are deprecated since 11.0.0 in
 * favour of `createEsi` and `esi.as(identity)` from `@lgriffin/esi.ts/client`,
 * and are removed no earlier than 12.0.0. {@link EsiApiFactory.createClient}
 * is not deprecated.
 *
 * @example
 * ```ts
 * import { createEsi } from '@lgriffin/esi.ts/client';
 *
 * const esi = createEsi({ userAgent: 'price-checker/1.0 (ops@example.com)' });
 * const prices = await esi.public.markets.prices.get();
 * const wallet = await esi
 *   .as(tokens.identity(characterId))
 *   .character(characterId)
 *   .wallet.get();
 * ```
 */
export class EsiApiFactory {
  /**
   * A standalone `AllianceClient` on its own `ApiClient`.
   *
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For an alliance's public record:
   * `esi.public.alliance(allianceId).get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a character's public record:
   * `esi.public.character(characterId).get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a corporation's public record:
   * `esi.public.corporation(corporationId).get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a region's sell orders, every page followed:
   * `esi.public.market(regionId).orders.get({ order_type: 'sell' })`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a type:
   * `esi.public.universe.types(typeId).get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a fleet, as its member:
   * `esi.as(identity).fleet(fleetId).get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a character's assets:
   * `esi.as(identity).character(characterId).assets.get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a character's wallet balance:
   * `esi.as(identity).character(characterId).wallet.get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
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
   * @deprecated Since 11.0.0; removal is 12.0.0 at the earliest. Use the
   * shared runtime from `@lgriffin/esi.ts/client`: `createEsi({ userAgent })`
   * once, then `esi.public` for public operations and `esi.as(identity)` for
   * authenticated ones. For a character's mail headers:
   * `esi.as(identity).character(characterId).mail.get()`.
   * To stay on the legacy client meanwhile, `EsiApiFactory.createClient(type)`
   * is not deprecated. See guides/MULTI-CHARACTER.md.
   */
  static createMailClient(config?: EsiClientConfig): MailClient {
    return createClientInstance(
      'mail',
      this.buildApiClient(config),
    ) as MailClient;
  }

  /**
   * Any of the registered domain clients, by name, on its own `ApiClient`.
   * Not deprecated; use it to stay on the legacy domain clients.
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
    return client;
  }
}

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
}
