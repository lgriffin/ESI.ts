/**
 * ESI Client Builder - Flexible API Client Creation
 * 
 * Allows users to create lightweight ESI clients with only the APIs they need,
 * or instantiate individual API clients directly.
 */

import { ApiClient } from './core/ApiClient';
import { ApiClientBuilder } from './core/ApiClientBuilder';
import { apiFactory, ApiFactory } from './core/factory/ApiFactory';
import { EsiClientConfig } from './EsiClient';
import logger from './core/logger/logger';

// Import all client types
import { AllianceClient } from './clients/AllianceClient';
import { AssetsClient } from './clients/AssetsClient';
import { BookmarkClient } from './clients/BookmarkClient';
import { CalendarClient } from './clients/CalendarClient';
import { CharacterClient } from './clients/CharacterClient';
import { ClonesClient } from './clients/ClonesClient';
import { ContactsClient } from './clients/ContactsClient';
import { ContractsClient } from './clients/ContractsClient';
import { CorporationsClient } from './clients/CorporationsClient';
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
import { OpportunitiesClient } from './clients/OpportunitiesClient';
import { PIClient as PiClient } from './clients/PiClient';
import { RouteClient } from './clients/RouteClient';
import { SearchClient } from './clients/SearchClient';
import { SovereigntyClient } from './clients/SovereigntyClient';
import { StatusClient } from './clients/StatusClient';
import { UIClient as UiClient } from './clients/UiClient';
import { UniverseClient } from './clients/UniverseClient';
import { WalletClient } from './clients/WalletClient';
import { WarsClient } from './clients/WarsClient';

// Type definitions for available clients
export type ApiClientType = 
  | 'alliance' | 'assets' | 'bookmarks' | 'calendar' | 'characters' | 'clones'
  | 'contacts' | 'contracts' | 'corporations' | 'dogma' | 'factions' | 'fittings'
  | 'fleets' | 'incursions' | 'industry' | 'insurance' | 'killmails' | 'location'
  | 'loyalty' | 'mail' | 'market' | 'opportunities' | 'pi' | 'route' | 'search'
  | 'sovereignty' | 'status' | 'ui' | 'universe' | 'wallet' | 'wars';

export type ClientInstance = 
  | AllianceClient | AssetsClient | BookmarkClient | CalendarClient | CharacterClient
  | ClonesClient | ContactsClient | ContractsClient | CorporationsClient | DogmaClient
  | FactionClient | FittingsClient | FleetClient | IncursionsClient | IndustryClient
  | InsuranceClient | KillmailsClient | LocationClient | LoyaltyClient | MailClient
  | MarketClient | OpportunitiesClient | PiClient | RouteClient | SearchClient
  | SovereigntyClient | StatusClient | UiClient | UniverseClient | WalletClient | WarsClient;

/**
 * Custom ESI Client - Lightweight client with only specified APIs
 */
export class CustomEsiClient {
  private factory: ApiFactory;
  private apiClient: ApiClient;
  private clients: Map<string, ClientInstance> = new Map();
  private enabledClients: Set<ApiClientType>;

  constructor(config: EsiClientConfig & { clients: ApiClientType[] }) {
    this.factory = apiFactory;
    this.enabledClients = new Set(config.clients);
    
    // Create the underlying API client
    this.apiClient = this.factory.createClient('custom', {
      clientId: config.clientId || 'esi-custom-client',
      baseUrl: config.baseUrl || 'https://esi.evetech.net',
      accessToken: config.accessToken,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3
    });

    this.initializeRequestedClients();
    
    logger.info(`CustomEsiClient initialized with clients: ${Array.from(this.enabledClients).join(', ')}`);
  }

  private initializeRequestedClients(): void {
    const clientFactories: Record<ApiClientType, () => ClientInstance> = {
      alliance: () => new AllianceClient(this.apiClient),
      assets: () => new AssetsClient(this.apiClient),
      bookmarks: () => new BookmarkClient(this.apiClient),
      calendar: () => new CalendarClient(this.apiClient),
      characters: () => new CharacterClient(this.apiClient),
      clones: () => new ClonesClient(this.apiClient),
      contacts: () => new ContactsClient(this.apiClient),
      contracts: () => new ContractsClient(this.apiClient),
      corporations: () => new CorporationsClient(this.apiClient),
      dogma: () => new DogmaClient(this.apiClient),
      factions: () => new FactionClient(this.apiClient),
      fittings: () => new FittingsClient(this.apiClient),
      fleets: () => new FleetClient(this.apiClient),
      incursions: () => new IncursionsClient(this.apiClient),
      industry: () => new IndustryClient(this.apiClient),
      insurance: () => new InsuranceClient(this.apiClient),
      killmails: () => new KillmailsClient(this.apiClient),
      location: () => new LocationClient(this.apiClient),
      loyalty: () => new LoyaltyClient(this.apiClient),
      mail: () => new MailClient(this.apiClient),
      market: () => new MarketClient(this.apiClient),
      opportunities: () => new OpportunitiesClient(this.apiClient),
      pi: () => new PiClient(this.apiClient),
      route: () => new RouteClient(this.apiClient),
      search: () => new SearchClient(this.apiClient),
      sovereignty: () => new SovereigntyClient(this.apiClient),
      status: () => new StatusClient(this.apiClient),
      ui: () => new UiClient(this.apiClient),
      universe: () => new UniverseClient(this.apiClient),
      wallet: () => new WalletClient(this.apiClient),
      wars: () => new WarsClient(this.apiClient)
    };

    // Only initialize the requested clients
    this.enabledClients.forEach(clientType => {
      this.clients.set(clientType, clientFactories[clientType]());
    });
  }

  /**
   * Get a client instance
   */
  getClient<T extends ApiClientType>(clientType: T): ClientInstance | undefined {
    return this.clients.get(clientType);
  }

  /**
   * Check if a client is available
   */
  hasClient(clientType: ApiClientType): boolean {
    return this.clients.has(clientType);
  }

  /**
   * Get list of enabled clients
   */
  getEnabledClients(): ApiClientType[] {
    return Array.from(this.enabledClients);
  }

  /**
   * Dynamic getters for each client type
   */
  get alliance(): AllianceClient | undefined { return this.getClient('alliance') as AllianceClient; }
  get assets(): AssetsClient | undefined { return this.getClient('assets') as AssetsClient; }
  get bookmarks(): BookmarkClient | undefined { return this.getClient('bookmarks') as BookmarkClient; }
  get calendar(): CalendarClient | undefined { return this.getClient('calendar') as CalendarClient; }
  get characters(): CharacterClient | undefined { return this.getClient('characters') as CharacterClient; }
  get clones(): ClonesClient | undefined { return this.getClient('clones') as ClonesClient; }
  get contacts(): ContactsClient | undefined { return this.getClient('contacts') as ContactsClient; }
  get contracts(): ContractsClient | undefined { return this.getClient('contracts') as ContractsClient; }
  get corporations(): CorporationsClient | undefined { return this.getClient('corporations') as CorporationsClient; }
  get dogma(): DogmaClient | undefined { return this.getClient('dogma') as DogmaClient; }
  get factions(): FactionClient | undefined { return this.getClient('factions') as FactionClient; }
  get fittings(): FittingsClient | undefined { return this.getClient('fittings') as FittingsClient; }
  get fleets(): FleetClient | undefined { return this.getClient('fleets') as FleetClient; }
  get incursions(): IncursionsClient | undefined { return this.getClient('incursions') as IncursionsClient; }
  get industry(): IndustryClient | undefined { return this.getClient('industry') as IndustryClient; }
  get insurance(): InsuranceClient | undefined { return this.getClient('insurance') as InsuranceClient; }
  get killmails(): KillmailsClient | undefined { return this.getClient('killmails') as KillmailsClient; }
  get location(): LocationClient | undefined { return this.getClient('location') as LocationClient; }
  get loyalty(): LoyaltyClient | undefined { return this.getClient('loyalty') as LoyaltyClient; }
  get mail(): MailClient | undefined { return this.getClient('mail') as MailClient; }
  get market(): MarketClient | undefined { return this.getClient('market') as MarketClient; }
  get opportunities(): OpportunitiesClient | undefined { return this.getClient('opportunities') as OpportunitiesClient; }
  get pi(): PiClient | undefined { return this.getClient('pi') as PiClient; }
  get route(): RouteClient | undefined { return this.getClient('route') as RouteClient; }
  get search(): SearchClient | undefined { return this.getClient('search') as SearchClient; }
  get sovereignty(): SovereigntyClient | undefined { return this.getClient('sovereignty') as SovereigntyClient; }
  get status(): StatusClient | undefined { return this.getClient('status') as StatusClient; }
  get ui(): UiClient | undefined { return this.getClient('ui') as UiClient; }
  get universe(): UniverseClient | undefined { return this.getClient('universe') as UniverseClient; }
  get wallet(): WalletClient | undefined { return this.getClient('wallet') as WalletClient; }
  get wars(): WarsClient | undefined { return this.getClient('wars') as WarsClient; }

  /**
   * Shutdown the client and clean up resources
   */
  async shutdown(): Promise<void> {
    await this.factory.shutdown();
    logger.info('CustomEsiClient shutdown completed');
  }
}

/**
 * Factory functions for creating individual API clients
 */
export class EsiApiFactory {
  private static createApiClient(config?: EsiClientConfig): ApiClient {
    const factory = apiFactory;
    return factory.createClient('standalone', {
      clientId: config?.clientId || 'esi-standalone-client',
      baseUrl: config?.baseUrl || 'https://esi.evetech.net',
      accessToken: config?.accessToken,
      timeout: config?.timeout || 30000,
      retryAttempts: config?.retryAttempts || 3
    });
  }

  /**
   * Create a standalone Alliance client
   */
  static createAllianceClient(config?: EsiClientConfig): AllianceClient {
    return new AllianceClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Character client
   */
  static createCharacterClient(config?: EsiClientConfig): CharacterClient {
    return new CharacterClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Corporation client
   */
  static createCorporationClient(config?: EsiClientConfig): CorporationsClient {
    return new CorporationsClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Market client
   */
  static createMarketClient(config?: EsiClientConfig): MarketClient {
    return new MarketClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Universe client
   */
  static createUniverseClient(config?: EsiClientConfig): UniverseClient {
    return new UniverseClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Fleet client
   */
  static createFleetClient(config?: EsiClientConfig): FleetClient {
    return new FleetClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Assets client
   */
  static createAssetsClient(config?: EsiClientConfig): AssetsClient {
    return new AssetsClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Wallet client
   */
  static createWalletClient(config?: EsiClientConfig): WalletClient {
    return new WalletClient(this.createApiClient(config));
  }

  /**
   * Create a standalone Mail client
   */
  static createMailClient(config?: EsiClientConfig): MailClient {
    return new MailClient(this.createApiClient(config));
  }

  /**
   * Generic method to create any client type
   */
  static createClient<T extends ApiClientType>(clientType: T, config?: EsiClientConfig): ClientInstance {
    const apiClient = this.createApiClient(config);
    
    const clientFactories: Record<ApiClientType, () => ClientInstance> = {
      alliance: () => new AllianceClient(apiClient),
      assets: () => new AssetsClient(apiClient),
      bookmarks: () => new BookmarkClient(apiClient),
      calendar: () => new CalendarClient(apiClient),
      characters: () => new CharacterClient(apiClient),
      clones: () => new ClonesClient(apiClient),
      contacts: () => new ContactsClient(apiClient),
      contracts: () => new ContractsClient(apiClient),
      corporations: () => new CorporationsClient(apiClient),
      dogma: () => new DogmaClient(apiClient),
      factions: () => new FactionClient(apiClient),
      fittings: () => new FittingsClient(apiClient),
      fleets: () => new FleetClient(apiClient),
      incursions: () => new IncursionsClient(apiClient),
      industry: () => new IndustryClient(apiClient),
      insurance: () => new InsuranceClient(apiClient),
      killmails: () => new KillmailsClient(apiClient),
      location: () => new LocationClient(apiClient),
      loyalty: () => new LoyaltyClient(apiClient),
      mail: () => new MailClient(apiClient),
      market: () => new MarketClient(apiClient),
      opportunities: () => new OpportunitiesClient(apiClient),
      pi: () => new PiClient(apiClient),
      route: () => new RouteClient(apiClient),
      search: () => new SearchClient(apiClient),
      sovereignty: () => new SovereigntyClient(apiClient),
      status: () => new StatusClient(apiClient),
      ui: () => new UiClient(apiClient),
      universe: () => new UniverseClient(apiClient),
      wallet: () => new WalletClient(apiClient),
      wars: () => new WarsClient(apiClient)
    };

    return clientFactories[clientType]();
  }
}

/**
 * Convenience builder class
 */
export class EsiClientBuilder {
  private clients: ApiClientType[] = [];
  private config: EsiClientConfig = {};

  /**
   * Add a client type to the builder
   */
  addClient(clientType: ApiClientType): this {
    if (!this.clients.includes(clientType)) {
      this.clients.push(clientType);
    }
    return this;
  }

  /**
   * Add multiple client types
   */
  addClients(clientTypes: ApiClientType[]): this {
    clientTypes.forEach(type => this.addClient(type));
    return this;
  }

  /**
   * Set configuration
   */
  withConfig(config: EsiClientConfig): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Set client ID
   */
  withClientId(clientId: string): this {
    this.config.clientId = clientId;
    return this;
  }

  /**
   * Set access token
   */
  withAccessToken(accessToken: string): this {
    this.config.accessToken = accessToken;
    return this;
  }

  /**
   * Build the custom client
   */
  build(): CustomEsiClient {
    if (this.clients.length === 0) {
      throw new Error('At least one client type must be specified');
    }

    return new CustomEsiClient({
      ...this.config,
      clients: this.clients
    });
  }
}
