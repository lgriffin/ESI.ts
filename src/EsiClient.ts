import { ApiClient, TokenProvider } from './core/ApiClient';
import {
  RequestInterceptor,
  ResponseInterceptor,
} from './core/middleware/Middleware';
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
import { validateBaseUrl } from './core/util/validation';
import {
  ETagCacheManager,
  ETagCacheConfig,
} from './core/cache/ETagCacheManager';
import {
  CircuitBreaker,
  CircuitBreakerConfig,
} from './core/circuitBreaker/CircuitBreaker';
import { RateLimiter } from './core/rateLimiter/RateLimiter';
import logger from './core/logger/logger';

export type EsiDatasource = 'tranquility' | 'singularity';

export interface EsiClientConfig {
  clientId?: string;
  baseUrl?: string;
  accessToken?: string;
  datasource?: EsiDatasource;
  onTokenRefresh?: TokenProvider;
  timeout?: number;
  retryAttempts?: number;
  enableETagCache?: boolean;
  etagCacheConfig?: ETagCacheConfig;
  enableCircuitBreaker?: boolean;
  circuitBreakerConfig?: CircuitBreakerConfig;
  unsafeAllowCustomHost?: boolean;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export class EsiClient {
  private apiClient: ApiClient;
  private clients: Map<string, unknown> = new Map();
  private etagCacheEnabled: boolean;

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

    if (config?.onTokenRefresh) {
      this.apiClient.setTokenProvider(config.onTokenRefresh);
    }

    this.apiClient.setRateLimiter(new RateLimiter());

    this.etagCacheEnabled = config?.enableETagCache !== false;
    if (this.etagCacheEnabled) {
      this.apiClient.setCache(new ETagCacheManager(config?.etagCacheConfig));
    }

    if (config?.enableCircuitBreaker) {
      this.apiClient.setCircuitBreaker(
        new CircuitBreaker(config.circuitBreakerConfig),
      );
    }

    if (config?.requestInterceptors) {
      for (const interceptor of config.requestInterceptors) {
        this.apiClient.addRequestInterceptor(interceptor);
      }
    }
    if (config?.responseInterceptors) {
      for (const interceptor of config.responseInterceptors) {
        this.apiClient.addResponseInterceptor(interceptor);
      }
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

  addRequestInterceptor(fn: RequestInterceptor): () => void {
    return this.apiClient.addRequestInterceptor(fn);
  }

  addResponseInterceptor(fn: ResponseInterceptor): () => void {
    return this.apiClient.addResponseInterceptor(fn);
  }

  setAccessToken(token: string): void {
    this.apiClient.setAccessToken(token);
    logger.info('Access token updated');
  }

  setTokenProvider(provider: TokenProvider | undefined): void {
    this.apiClient.setTokenProvider(provider);
    logger.info(
      provider ? 'Token provider configured' : 'Token provider removed',
    );
  }

  getCacheStats(): {
    totalEntries: number;
    maxEntries: number;
    hits: number;
    misses: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } | null {
    if (!this.etagCacheEnabled) return null;
    const cache = this.apiClient.getCache();
    return cache ? (cache as ETagCacheManager).getStats() : null;
  }

  clearCache(): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).clear();
    }
  }

  updateCacheConfig(newConfig: Partial<ETagCacheConfig>): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).updateConfig(newConfig);
    }
  }

  getCircuitBreakerStats(): {
    totalCircuits: number;
    openCircuits: number;
    circuits: Record<
      string,
      { state: 'closed' | 'open' | 'half-open'; failures: number }
    >;
  } | null {
    const cb = this.apiClient.getCircuitBreaker();
    return cb ? cb.getStats() : null;
  }

  resetCircuitBreaker(endpoint?: string): void {
    const cb = this.apiClient.getCircuitBreaker();
    if (cb) {
      cb.reset(endpoint);
    }
  }

  shutdown(): void {
    const cache = this.apiClient.getCache();
    if (cache) {
      (cache as ETagCacheManager).shutdown();
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
