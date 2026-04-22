import { ApiClient } from './core/ApiClient';
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
} from './core/ClientRegistry';
import { EsiClientConfig } from './EsiClient';
import logger from './core/logger/logger';

export { ApiClientType, ClientInstance };

export class CustomEsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, ClientInstance> = new Map();
  private enabledClients: Set<ApiClientType>;

  constructor(config: EsiClientConfig & { clients: ApiClientType[] }) {
    this.enabledClients = new Set(config.clients);
    this.apiClient = new ApiClient(
      config.clientId || process.env.ESI_CLIENT_ID || 'esi-custom-client',
      config.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      config.accessToken || process.env.ESI_ACCESS_TOKEN,
    );

    for (const name of this.enabledClients) {
      this.clients.set(name, createClientInstance(name, this.apiClient));
    }

    logger.info(
      `CustomEsiClient initialized with clients: ${config.clients.join(', ')}`,
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

  shutdown(): void {
    this.clients.clear();
    logger.info('CustomEsiClient shutdown completed');
  }
}

export class EsiApiFactory {
  static createAllianceClient(config?: EsiClientConfig): AllianceClient {
    return createClientInstance(
      'alliance',
      this.buildApiClient(config),
    ) as AllianceClient;
  }

  static createCharacterClient(config?: EsiClientConfig): CharacterClient {
    return createClientInstance(
      'characters',
      this.buildApiClient(config),
    ) as CharacterClient;
  }

  static createCorporationClient(config?: EsiClientConfig): CorporationsClient {
    return createClientInstance(
      'corporations',
      this.buildApiClient(config),
    ) as CorporationsClient;
  }

  static createMarketClient(config?: EsiClientConfig): MarketClient {
    return createClientInstance(
      'market',
      this.buildApiClient(config),
    ) as MarketClient;
  }

  static createUniverseClient(config?: EsiClientConfig): UniverseClient {
    return createClientInstance(
      'universe',
      this.buildApiClient(config),
    ) as UniverseClient;
  }

  static createFleetClient(config?: EsiClientConfig): FleetClient {
    return createClientInstance(
      'fleets',
      this.buildApiClient(config),
    ) as FleetClient;
  }

  static createAssetsClient(config?: EsiClientConfig): AssetsClient {
    return createClientInstance(
      'assets',
      this.buildApiClient(config),
    ) as AssetsClient;
  }

  static createWalletClient(config?: EsiClientConfig): WalletClient {
    return createClientInstance(
      'wallet',
      this.buildApiClient(config),
    ) as WalletClient;
  }

  static createMailClient(config?: EsiClientConfig): MailClient {
    return createClientInstance(
      'mail',
      this.buildApiClient(config),
    ) as MailClient;
  }

  static createClient(
    clientType: ApiClientType,
    config?: EsiClientConfig,
  ): ClientInstance {
    return createClientInstance(clientType, this.buildApiClient(config));
  }

  private static buildApiClient(config?: EsiClientConfig): ApiClient {
    return new ApiClient(
      config?.clientId || process.env.ESI_CLIENT_ID || 'esi-standalone-client',
      config?.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      config?.accessToken || process.env.ESI_ACCESS_TOKEN,
    );
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
