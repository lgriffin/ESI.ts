import { ApiClient } from './core/ApiClient';
import { createClientInstance, ApiClientType } from './core/ClientRegistry';
import { AllianceClient } from './clients/AllianceClient';
import { AssetsClient } from './clients/AssetsClient';
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
import { initializeETagCache, getETagCache } from './core/ApiRequestHandler';
import { ETagCacheConfig } from './core/cache/ETagCacheManager';
import logger from './core/logger/logger';

export interface EsiClientConfig {
  clientId?: string;
  baseUrl?: string;
  accessToken?: string;
  timeout?: number;
  retryAttempts?: number;
  enableETagCache?: boolean;
  etagCacheConfig?: ETagCacheConfig;
}

export class EsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, unknown> = new Map();
  private etagCacheEnabled: boolean;

  constructor(config?: EsiClientConfig) {
    const token = config?.accessToken || process.env.ESI_ACCESS_TOKEN;
    this.apiClient = new ApiClient(
      config?.clientId || process.env.ESI_CLIENT_ID || 'esi-client',
      config?.baseUrl || process.env.ESI_BASE_URL || 'https://esi.evetech.net',
      token,
    );

    this.etagCacheEnabled = config?.enableETagCache !== false;
    if (this.etagCacheEnabled) {
      initializeETagCache(config?.etagCacheConfig);
    }

    logger.info('EsiClient initialized successfully');
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

  setAccessToken(token: string): void {
    this.apiClient.setAccessToken(token);
    logger.info('Access token updated');
  }

  getCacheStats(): {
    totalEntries: number;
    maxEntries: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } | null {
    if (!this.etagCacheEnabled) return null;
    const cache = getETagCache();
    return cache ? cache.getStats() : null;
  }

  clearCache(): void {
    const cache = getETagCache();
    if (cache) {
      cache.clear();
    }
  }

  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    const cache = getETagCache();
    if (cache) {
      cache.updateConfig(newConfig);
    }
  }

  shutdown(): void {
    const cache = getETagCache();
    if (cache) {
      cache.shutdown();
    }
    this.clients.clear();
    logger.info('EsiClient shutdown completed');
  }
}

let _defaultClient: EsiClient | null = null;
export function getDefaultClient(): EsiClient {
  if (!_defaultClient) {
    _defaultClient = new EsiClient();
  }
  return _defaultClient;
}
